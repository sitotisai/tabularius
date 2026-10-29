# Install Tabularius with one command, on Windows (PowerShell 5.1 or 7):
#
#   powershell -NoProfile -File scripts\install.ps1                    from a checkout
#   powershell -NoProfile -File scripts\install.ps1 -Service C:\Databases
#                                     ...and run it as a service that hosts that folder
#
# It uses Node 22.20+ if you have it, and otherwise downloads Node into
# %USERPROFILE%\.openhbam\node (nothing is installed system-wide). It puts an
# `tabularius` command in %USERPROFILE%\.openhbam\bin and adds that to your PATH.
# Run from a trusted local checkout. This installer never fetches executable app
# source from a moving branch. Verify release checksums before extracting a release.
# If execution policy blocks this script, follow your organization's signing policy;
# the installer does not bypass it.
#
# Service options: -Port 8080, -HostName (default: this machine only, or every
# address when -ServeArgs '--https','files.example.com' asks for a certificate; 0.0.0.0
# reaches the network and needs HTTPS: -ServeArgs '--https','local'), -ServeArgs for more
# `tabularius serve` options, e.g. -ServeArgs '--sql-port','5432'.
#
#   -System      run at boot without anyone signed in, as the system account
#                (run from an administrator prompt; also opens the port in
#                Windows Firewall). It is refused unless Node and the app can be
#                changed only by administrators (not the default per-user folders):
#                see docs/service-files.md
#   -Print       show the Task Scheduler task instead of installing it
#   -Uninstall   stop the service and remove it (hosted files are kept)
#   -Upgrade     refused here: use tabularius upgrade --from with a trusted local
#                release after verifying its published checksum

param(
  [string]$Service,
  [int]$Port = 8080,
  [string]$HostName = '',
  [switch]$System,
  [switch]$Print,
  [switch]$Uninstall,
  [switch]$Upgrade,
  [string[]]$ServeArgs = @()
)

$ErrorActionPreference = 'Stop'
# BEGIN offline decisions
$Messages = @{
  Download = 'The Node download failed or was interrupted; check Internet access, your proxy and TLS certificate trust, then retry.'
  Write = 'The installer cannot write to its install or temporary folder; check folder permissions and free disk space, then retry.'
  Checksum = 'SHA256 mismatch or missing checksum for the Node download; retry the download from nodejs.org and do not use the damaged archive.'
  Archive = 'The verified Node archive could not be extracted; check free disk space and security software, then retry.'
  Blocked = 'The downloaded Node cannot run --version; check Windows Security or SmartScreen and ask your administrator to review the verified download before retrying.'
  Architecture = 'This Windows processor is unsupported; use 64-bit Windows on x64 or Arm64 and retry.'
  Replace = 'The Node installation could not be replaced, possibly because it is in use; close programs using it, check folder permissions and retry.'
  Recovery = 'A saved node.previous installation needs recovery; keep it and restore it to node when that folder is absent before retrying.'
  PathWrite = 'The user PATH could not be saved; check account permissions and add the install bin folder to your user PATH before opening a new terminal.'
  AppLaunch = 'The application cannot run --version; check the trusted checkout and Windows Security before retrying.'
  Path = 'An existing terminal may not see the updated PATH; open a new terminal before running tabularius.'
  Policy = 'PowerShell policy refused the script before it could run; ask your administrator to approve or sign the trusted local script.'
  Dependencies = 'The application dependencies could not be installed; check npm availability, Internet access, proxy and TLS trust, and checkout write access before retrying.'
  Service = 'The service or firewall operation failed; check administrator rights and the service configuration before retrying.'
  Unexpected = 'The installer could not finish; check the trusted checkout, folder permissions and Windows Security before retrying.'
  Upgrade = 'This installer cannot upgrade application source; use tabularius upgrade --from with a checksum-verified local release.'
  Actions = 'Uninstall cannot be combined with Service or Print; run these actions separately.'
  Port = 'The port is outside the valid range; choose a port between 1 and 65535.'
  Administrator = 'System installation needs administrator rights; open an administrator prompt and retry.'
  Source = 'The application source is missing; run this installer from a trusted local checkout or verified extracted release.'
  LocalNode = 'This action needs compatible local Node and cannot download it; install Node 22.20 or newer before retrying.'
}
# Native Windows architecture and security-block behavior remain unverified offline.
function Get-NodeArchitecture([string]$processArch, [string]$nativeArch) {
  $cpu = if ($nativeArch) { $nativeArch } else { $processArch }
  switch ($cpu) { 'AMD64' { return 'x64' } 'ARM64' { return 'arm64' } default { return $null } }
}
function Get-NodeArchive([string]$version, [string]$arch) { return "node-v$version-win-$arch.zip" }
function Test-Checksum([string]$expected, [string]$actual) {
  return ($expected -match '\A[0-9a-fA-F]{64}\z' -and $actual -eq $expected)
}
# END offline decisions

$script:Failure = 'Unexpected'
# Do not print PowerShell error records, which can expose local paths or proxy details.
trap { [Console]::Error.WriteLine("error: " + $Messages[$script:Failure]); exit 1 }
function Say([string]$m) { Write-Host "==> $m" }
function Die([string]$key) { $script:Failure = $key; throw $Messages[$key] }

$OhHome = if ($env:TABULARIUS_HOME) { $env:TABULARIUS_HOME } elseif ($env:OPENHBAM_HOME) { $env:OPENHBAM_HOME } else { Join-Path $env:USERPROFILE '.openhbam' }
$NodeVersion = '22.22.0'

# Validate actions before downloading, installing dependencies or changing a task.
if ($Upgrade) { Die 'Upgrade' }
if ($Uninstall -and ($Service -or $Print)) { Die 'Actions' }
if ($Port -lt 1 -or $Port -gt 65535) { Die 'Port' }
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($System -and -not $Print -and -not $isAdmin) { Die 'Administrator' }
$here = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { $null }
$App = if ($here -and (Test-Path -LiteralPath (Join-Path $here 'packages\cli\src\main.ts'))) { $here } else { Join-Path $OhHome 'app' }
$Cli = Join-Path $App 'packages\cli\src\main.ts'
if (-not (Test-Path -LiteralPath $Cli)) { Die 'Source' }

# --- Node ------------------------------------------------------------------

function Test-Node([string]$exe) {
  try {
    $v = [version]((& $exe --version 2>$null) -replace '^v', '')
    return ($LASTEXITCODE -eq 0 -and $v -ge [version]'22.20.0')
  } catch {
    return $false
  }
}

$Node = $null
$found = Get-Command node -ErrorAction SilentlyContinue
$own = Join-Path $OhHome 'node\node.exe'
# Recover an interrupted Node replacement before trying to download anything.
$previousNode = Join-Path $OhHome 'node.previous'
if (-not ($Print -or $Uninstall) -and (Test-Path -LiteralPath $previousNode) -and -not (Test-Path -LiteralPath (Join-Path $OhHome 'node'))) {
  $script:Failure = 'Recovery'
  Move-Item -LiteralPath $previousNode -Destination (Join-Path $OhHome 'node')
}
if ($found -and (Test-Node $found.Source)) {
  $Node = $found.Source
} elseif ((Test-Path $own) -and (Test-Node $own)) {
  $Node = $own
} else {
  if ($Print -or $Uninstall) { Die 'LocalNode' }
  $arch = Get-NodeArchitecture $env:PROCESSOR_ARCHITECTURE $env:PROCESSOR_ARCHITEW6432
  if (-not $arch) { Die 'Architecture' }
  Say "Downloading Node $NodeVersion into $OhHome\node"
  $script:Failure = 'Write'
  New-Item -ItemType Directory -Force -Path $OhHome | Out-Null
  # Stage on the destination volume so publication is a rename, not a partial copy.
  $tmp = Join-Path $OhHome ("tabularius-node-" + [guid]::NewGuid())
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  try {
    $zip = Join-Path $tmp 'node.zip'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $file = Get-NodeArchive $NodeVersion $arch
    $dist = "https://nodejs.org/dist/v$NodeVersion"
    $sums = Join-Path $tmp 'SHASUMS256.txt'
    $script:Failure = 'Download'
    Invoke-WebRequest -UseBasicParsing -Uri "$dist/$file" -OutFile $zip
    Invoke-WebRequest -UseBasicParsing -Uri "$dist/SHASUMS256.txt" -OutFile $sums
    $script:Failure = 'Checksum'
    $expected = '<missing>'
    foreach ($line in (Get-Content -LiteralPath $sums)) {
      if ($line.TrimEnd("`r") -cmatch '\A([0-9a-fA-F]{64}) {1,2}\*?(.*)\z' -and $Matches[2] -ceq $file) {
        $expected = $Matches[1]
        break
      }
    }
    $actual = (Get-FileHash -Algorithm SHA256 -Path $zip).Hash.ToLowerInvariant()
    if (-not (Test-Checksum $expected $actual)) {
      Die 'Checksum'
    }
    $script:Failure = 'Archive'
    Expand-Archive -Path $zip -DestinationPath $tmp
    $candidate = Join-Path $tmp "node-v$NodeVersion-win-$arch\node.exe"
    if (-not (Test-Node $candidate)) { Die 'Blocked' }
    $script:Failure = 'Replace'
    if (Test-Path -LiteralPath $previousNode) { Die 'Recovery' }
    if (Test-Path -LiteralPath (Join-Path $OhHome 'node')) {
      Move-Item -LiteralPath (Join-Path $OhHome 'node') -Destination $previousNode
    }
    try {
      Move-Item -LiteralPath (Join-Path $tmp "node-v$NodeVersion-win-$arch") -Destination (Join-Path $OhHome 'node')
    } catch {
      # Never remove the saved version if rollback itself fails.
      $script:Failure = 'Recovery'
      if (Test-Path -LiteralPath $previousNode) { Move-Item -LiteralPath $previousNode -Destination (Join-Path $OhHome 'node') }
      Die 'Replace'
    }
    if (Test-Path -LiteralPath $previousNode) { Remove-Item -LiteralPath $previousNode -Recurse -Force }
  } finally {
    # Cleanup must not mask the original failure; warn with a recovery step.
    try { Remove-Item -LiteralPath $tmp -Recurse -Force }
    catch { Say 'Temporary Node files could not be removed; remove tabularius-node-* from your install folder after closing the installer.' }
  }
  $Node = $own
}
$NodeDir = Split-Path $Node
Say "Using Node at $Node"

# --- the app -----------------------------------------------------------------

$env:TABULARIUS_HOME = $OhHome
$env:PATH = "$NodeDir;$env:PATH"

# Uninstall uses the installed app and local Node, without installing dependencies.
if ($Uninstall) {
  $script:Failure = 'Service'
  & $Node --no-warnings $Cli service uninstall --platform win32 2>$null
  if ($LASTEXITCODE) { Die 'Service' }
  if ($isAdmin) {
    Get-NetFirewallRule -Name 'tabularius-server' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
  } else {
    Say 'If a system firewall rule was installed, remove tabularius-server from an administrator prompt'
  }
  exit 0
}

if (-not $Print) {
  $script:Failure = 'Dependencies'
  $Npm = Join-Path $NodeDir 'npm.cmd'
  if (-not (Test-Path -LiteralPath $Npm)) { $Npm = (Get-Command npm.cmd).Source }
  Say 'Installing dependencies'
  Push-Location $App
  try {
    & $Npm ci --omit=dev --ignore-scripts --no-audit --no-fund 2>$null | Out-Null
    if ($LASTEXITCODE) { Die 'Dependencies' }
  } finally {
    Pop-Location
  }
  $script:Failure = 'AppLaunch'
  & $Node --no-warnings $Cli --version 2>$null | Out-Null
  if ($LASTEXITCODE) { Die 'AppLaunch' }
  $script:Failure = 'Write'
  $bin = Join-Path $OhHome 'bin'
  New-Item -ItemType Directory -Force -Path $bin | Out-Null
  # UTF-8 without BOM; switch CMD's code page before it reads non-ASCII paths.
  # Delayed expansion is disabled and literal percent signs are doubled.
  # CMD quoting/code-page behavior is unverified until the Windows checklist runs.
  $cmdNode = $Node.Replace('%', '%%')
  $cmdCli = $Cli.Replace('%', '%%')
  $wrapper = "@setlocal DisableDelayedExpansion`r`n@chcp 65001 >nul`r`n@`"$cmdNode`" --no-warnings `"$cmdCli`" %*`r`n@exit /b %errorlevel%`r`n"
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText((Join-Path $bin 'tabularius.cmd'), $wrapper, $utf8)
  # Keep the deprecated command alias.
  [IO.File]::WriteAllText((Join-Path $bin 'openhbam.cmd'), $wrapper, $utf8)
  Say "Installed $bin\tabularius.cmd (and openhbam.cmd, its old name)"
  $script:Failure = 'PathWrite'
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  if (-not (($userPath -split ';') -contains $bin)) {
    [Environment]::SetEnvironmentVariable('Path', ($(if ($userPath) { "$userPath;" } else { '' }) + $bin), 'User')
    Say "Added $bin to your PATH"
  }
  $env:PATH = "$bin;$env:PATH"
  Say $Messages.Path
}

# --- service -------------------------------------------------------------------

if (-not $Service) { Say 'Done. Try: tabularius serve <folder of .fmp12 files>'; exit 0 }
$action = if ($Print) { 'print' } else { 'install' }
$serviceArgs = @('--no-warnings', $Cli, 'service', $action, $Service, '--platform', 'win32', '--port', "$Port")
if ($HostName) { $serviceArgs += @('--host', $HostName) }
if ($System) { $serviceArgs += '--system' }
$serviceArgs += '--'
$serviceArgs += $ServeArgs
$script:Failure = 'Service'
& $Node @serviceArgs 2>$null
if ($LASTEXITCODE) { Die 'Service' }
# Reachable from the network: a host other than this computer, or a certificate for a domain (which listens on every address).
$httpsAt = [array]::IndexOf($ServeArgs, '--https')
$reachable = if ($HostName) { $HostName -notin @('127.0.0.1', '::1', 'localhost') } else { $httpsAt -ge 0 -and $httpsAt + 1 -lt $ServeArgs.Count -and @('local', 'lan') -notcontains $ServeArgs[$httpsAt + 1] }
if ($System -and -not $Print -and $reachable) {
  # Others on the network reach it only once the firewall lets them in.
  if (-not (Get-NetFirewallRule -Name 'tabularius-server' -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -Name 'tabularius-server' -DisplayName 'tabularius' -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow | Out-Null
    Say "Opened TCP port $Port in Windows Firewall"
  } else {
    Set-NetFirewallRule -Name 'tabularius-server' -LocalPort $Port -Protocol TCP -Action Allow | Out-Null
  }
} elseif ($System -and -not $Print) {
  Get-NetFirewallRule -Name 'tabularius-server' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
} elseif (-not $Print -and $reachable) {
  Say "If others can't reach it, allow TCP port $Port in Windows Firewall (or install with -System as administrator)"
}
