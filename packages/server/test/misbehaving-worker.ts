// The real worker plus messages no real follower should send. Send on startup, without a timing assumption about readiness.
import '../src/cluster-worker.ts';

process.on('message', (m: { t?: string; role?: { id: number } }) => {
  if (m?.t !== 'start' || m.role?.id !== 1) return;
  const junk: unknown[] = [
    { t: 'tell', note: { k: 'gone', from: 0 } },
    { t: 'tell', note: { k: 'tls', tls: { cert: 'x', key: 'y' } } },
    { t: 'tell', note: { k: 'approve', file: 'Shop', id: 'x' } },
    { t: 'tell', note: { k: 'design', file: '../../etc/passwd' } },
    { t: 'tell', note: { k: 'sessions', from: 0, list: [{}] } },
    { t: 'tell', note: { k: '__proto__' } },
    { t: 'tell', note: 'gone' },
    { t: 'ask', rid: 1, q: { k: 'file', name: 'a/b', action: 'close' } },
    { t: 'ask', rid: 'one', q: { k: 'file', name: 'Shop', action: 'close' } },
    { t: 'cancel', rid: -1 },
    { t: 'banana' },
    'gone',
    5,
  ];
  for (const message of junk) process.send!(message);
  process.send!({ t: 'tell', note: { k: 'open-state', from: 0, file: 'Shop', error: 'a made-up reason' } });
});
