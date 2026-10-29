// Throwaway experiment: which Task Scheduler settings restart a task after it dies?
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
const dir = 'C:\\exp'; mkdirSync(dir, { recursive: true });
const node = process.execPath;
const sh = (c: string, a: string[]) => { const r = spawnSync(c, a, { encoding: 'utf8' }); console.log(c, a.join(' '), '->', r.status, (r.stdout + r.stderr).trim().slice(0, 300)); return r; };
// each task appends its pid on start, then idles (or exits 1 after 5s for 'exit1')
function xml(name: string, mode: string, repeat: boolean) {
  const script = `${dir}\\${name}.js`;
  writeFileSync(script, `require('fs').appendFileSync('${dir.replace(/\\/g, '\\\\')}\\\\${name}.log', process.pid + ' ' + new Date().toISOString() + '\\n');` + (mode === 'exit1' ? 'setTimeout(()=>process.exit(1),5000);' : 'setInterval(()=>{},1000);'));
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>${repeat ? '<TimeTrigger><Repetition><Interval>PT1M</Interval><StopAtDurationEnd>false</StopAtDurationEnd></Repetition><StartBoundary>2020-01-01T00:00:00</StartBoundary><Enabled>true</Enabled></TimeTrigger>' : ''}<BootTrigger><Enabled>true</Enabled></BootTrigger></Triggers>
  <Principals><Principal id="Author"><UserId>S-1-5-18</UserId><RunLevel>HighestAvailable</RunLevel></Principal></Principals>
  <Settings><MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy><DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries><StopIfGoingOnBatteries>false</StopIfGoingOnBatteries><AllowHardTerminate>true</AllowHardTerminate><StartWhenAvailable>true</StartWhenAvailable><ExecutionTimeLimit>PT0S</ExecutionTimeLimit><Enabled>true</Enabled><RestartOnFailure><Interval>PT1M</Interval><Count>255</Count></RestartOnFailure></Settings>
  <Actions Context="Author"><Exec><Command>${node}</Command><Arguments>"${script}"</Arguments></Exec></Actions>
</Task>`;
}
const cases = [['killed', 'kill', false], ['exit1', 'exit1', false], ['killedrepeat', 'kill', true]] as const;
for (const [name, mode, repeat] of cases) {
  const f = `${dir}\\${name}.xml`;
  writeFileSync(f, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(xml(name, mode, repeat), 'utf16le')]));
  sh('schtasks', ['/Create', '/TN', name, '/XML', f, '/F']);
  sh('schtasks', ['/Run', '/TN', name]);
}
const wait = (s: number) => new Promise((r) => setTimeout(r, s * 1000));
await wait(10);
for (const [name, mode] of cases) if (mode === 'kill') { const pid = readFileSync(`${dir}\\${name}.log`, 'utf8').trim().split(/\r?\n/).pop()!.split(' ')[0]; sh('taskkill', ['/F', '/PID', pid]); }
await wait(200);
for (const [name] of cases) {
  console.log(`\n=== ${name}`);
  console.log(existsSync(`${dir}\\${name}.log`) ? readFileSync(`${dir}\\${name}.log`, 'utf8') : '(no log)');
  sh('schtasks', ['/Query', '/TN', name, '/V', '/FO', 'LIST']);
  sh('schtasks', ['/Delete', '/TN', name, '/F']);
}
