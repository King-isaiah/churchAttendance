<?php
// public/setup-db.php
// RUN THIS ONCE, THEN DELETE IMMEDIATELY!

echo "<h1>Setting Up Database Tables</h1>";
echo "<pre>";

try {
    $databaseUrl = getenv('DATABASE_URL');
    
    if (!$databaseUrl) {
        die("ERROR: DATABASE_URL is not set!\n\nPlease make sure DATABASE_URL environment variable is added in Render.");
    }
    
    echo "✅ Found DATABASE_URL\n";
    
    $db = parse_url($databaseUrl);
    $host = $db['host'];
    $port = $db['port'] ?? '5432';
    $dbname = ltrim($db['path'], '/');
    $user = $db['user'];
    $pass = $db['pass'];
    
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connected to PostgreSQL successfully!\n\n";
    
    // Check if tables already exist
    $result = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activities'");
    $tableExists = $result->fetchColumn() > 0;
    
    if ($tableExists) {
        echo "⚠️ Tables already exist. Dropping existing tables to recreate...\n";
        $pdo->exec("DROP TABLE IF EXISTS departments CASCADE");
        $pdo->exec("DROP TABLE IF EXISTS activities CASCADE");
        echo "✅ Old tables removed\n\n";
    }
    
    // Create activities table
    echo "📋 Creating activities table...\n";
    $pdo->exec("
        CREATE TABLE activities (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            attendance INTEGER DEFAULT 0,
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✅ activities table created\n";
    
    // Create departments table
    echo "📋 Creating departments table...\n";
    $pdo->exec("
        CREATE TABLE departments (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            totalNum INTEGER DEFAULT 0,
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✅ departments table created\n\n";
    
    // Insert sample data
    echo "📝 Inserting sample data...\n";
    
    $pdo->exec("
        INSERT INTO activities (name, attendance, date) VALUES 
        ('Sunday Service', 150, CURRENT_DATE),
        ('Bible Study', 45, CURRENT_DATE - INTERVAL '3 days'),
        ('Youth Group', 35, CURRENT_DATE - INTERVAL '2 days')
    ");
    echo "✅ Added 3 activities\n";
    
    $pdo->exec("
        INSERT INTO departments (name, totalNum, date) VALUES 
        ('Hub Ushering', 150, CURRENT_DATE),
        ('Hub Theatre', 45, CURRENT_DATE - INTERVAL '3 days'),
        ('Choir', 35, CURRENT_DATE - INTERVAL '2 days')
    ");
    echo "✅ Added 3 departments\n\n";
    
    // Verify everything
    echo "🔍 Verifying setup...\n";
    $activityCount = $pdo->query("SELECT COUNT(*) FROM activities")->fetchColumn();
    $deptCount = $pdo->query("SELECT COUNT(*) FROM departments")->fetchColumn();
    
    echo "Activities count: $activityCount\n";
    echo "Departments count: $deptCount\n\n";
    
    echo "📊 Tables in your database:\n";
    $tables = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    foreach ($tables as $table) {
        echo "  - " . $table['table_name'] . "\n";
    }
    
    echo "\n";
    echo "═══════════════════════════════════════════════════════════\n";
    echo "✅✅✅ DATABASE SETUP COMPLETE! ✅✅✅\n";
    echo "═══════════════════════════════════════════════════════════\n";
    echo "\n";
    echo "🎉 Your application should now work!\n";
    echo "\n";
    echo "⚠️  IMPORTANT: Delete this file (setup-db.php) immediately!\n";
    echo "⚠️  Go back to your Render dashboard and remove it from your project.\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString();
}
echo "</pre>";
?>