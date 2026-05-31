<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Admin') · PinTheBall</title>
    <style>
        :root {
            color-scheme: light;
            --bg: #f4f6f8;
            --panel: #ffffff;
            --line: #d9dee6;
            --text: #17202a;
            --muted: #667085;
            --accent: #2457c5;
            --danger: #b42318;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: var(--bg);
            color: var(--text);
        }
        a { color: var(--accent); text-decoration: none; }
        a:hover { text-decoration: underline; }
        .admin-shell { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
        .sidebar {
            background: #101828;
            color: #fff;
            padding: 24px 18px;
        }
        .brand { font-size: 20px; font-weight: 700; margin-bottom: 28px; }
        .nav a, .logout button {
            display: block;
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            color: #e4e7ec;
            background: transparent;
            border: 0;
            text-align: left;
            font: inherit;
            cursor: pointer;
        }
        .nav a:hover, .logout button:hover { background: #1d2939; text-decoration: none; }
        .logout { margin-top: 20px; }
        main { padding: 28px; }
        .topbar { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 24px; }
        h1 { margin: 0; font-size: 28px; }
        h2 { margin: 0 0 16px; font-size: 20px; }
        .muted { color: var(--muted); }
        .grid { display: grid; gap: 16px; }
        .grid.cards { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: 20px; }
        .grid.two { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        .card {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 18px;
            box-shadow: 0 1px 2px rgba(16, 24, 40, .06);
        }
        .stat { font-size: 32px; font-weight: 700; margin-top: 8px; }
        table { width: 100%; border-collapse: collapse; background: var(--panel); border: 1px solid var(--line); }
        th, td { padding: 11px 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
        th { background: #eef2f7; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; }
        tr:last-child td { border-bottom: 0; }
        .toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: end; margin-bottom: 16px; }
        label { display: grid; gap: 6px; font-weight: 700; font-size: 13px; }
        input, select {
            min-height: 38px;
            padding: 8px 10px;
            border: 1px solid var(--line);
            border-radius: 8px;
            background: #fff;
            font: inherit;
        }
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 38px;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid var(--accent);
            background: var(--accent);
            color: #fff;
            font: inherit;
            cursor: pointer;
        }
        .button.secondary { background: #fff; color: var(--accent); }
        .button.danger { border-color: var(--danger); background: var(--danger); }
        .inline-form { display: inline; }
        .notice, .errors {
            margin-bottom: 16px;
            padding: 12px 14px;
            border-radius: 8px;
            background: #ecfdf3;
            border: 1px solid #abefc6;
        }
        .errors { background: #fef3f2; border-color: #fecdca; color: var(--danger); }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
        .form-grid.compact { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin-bottom: 20px; }
        .form-section {
            margin-top: 22px;
            padding-top: 18px;
            border-top: 1px solid var(--line);
        }
        .form-section-title {
            margin: 0 0 4px;
            font-size: 17px;
            font-weight: 700;
        }
        .file-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 14px;
            margin-top: 14px;
        }
        .file-field {
            padding: 14px;
            border: 1px solid var(--line);
            border-radius: 10px;
            background: #f8fafc;
        }
        .file-field span {
            font-size: 12px;
            font-weight: 400;
            color: var(--muted);
        }
        input[type="file"] {
            width: 100%;
            padding: 7px;
            background: #fff;
        }
        input[type="file"]::file-selector-button {
            margin-right: 10px;
            padding: 7px 10px;
            border: 1px solid var(--accent);
            border-radius: 7px;
            background: #eef4ff;
            color: var(--accent);
            font: inherit;
            cursor: pointer;
        }
        .actions { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
        .pagination { display: flex; gap: 10px; margin-top: 16px; align-items: center; }
        @media (max-width: 760px) {
            .admin-shell { grid-template-columns: 1fr; }
            .sidebar { position: static; }
            main { padding: 18px; }
        }
    </style>
</head>
<body>
    <div class="admin-shell">
        <aside class="sidebar">
            <div class="brand">PinTheBall Admin</div>
            <nav class="nav">
                <a href="{{ route('admin.dashboard') }}">Dashboard</a>
                <a href="{{ route('admin.players') }}">Players</a>
                <a href="{{ route('admin.balls') }}">Balls</a>
                <a href="{{ route('admin.games') }}">Games</a>
            </nav>
            <form class="logout" method="post" action="{{ route('admin.logout') }}">
                @csrf
                <button type="submit">Logout</button>
            </form>
        </aside>
        <main>
            <div class="topbar">
                <div>
                    <h1>@yield('title', 'Admin')</h1>
                    <div class="muted">@yield('subtitle', 'Panel de administración')</div>
                </div>
                @yield('top-actions')
            </div>

            @if (session('status'))
                <div class="notice">{{ session('status') }}</div>
            @endif

            @if ($errors->any())
                <div class="errors">
                    @foreach ($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            @endif

            @yield('content')
        </main>
    </div>
</body>
</html>
