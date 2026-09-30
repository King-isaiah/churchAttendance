<?php
// public/test-db.php
// This file tests PostgreSQL connection and extension

echo "<h1>Database Connection Test</h1>";

// Test 1: Check if PDO PostgreSQL extension is loaded
echo "<h2>Test 1: Check PostgreSQL Extension</h2>";
if (extension_loaded('pdo_pgsql')) {
    echo "✅ PDO PostgreSQL extension is loaded<br>";
} else {
    echo "❌ PDO PostgreSQL extension is NOT loaded<br>";
}

if (extension_loaded('pgsql')) {
    echo "✅ PostgreSQL extension is loaded<br>";
} else {
    echo "❌ PostgreSQL extension is NOT loaded<br>";
}

// Test 2: Check all loaded PDO drivers
echo "<h2>Test 2: Available PDO Drivers</h2>";
$drivers = PDO::getAvailableDrivers();
echo "Available PDO drivers: " . implode(', ', $drivers) . "<br>";
if (in_array('pgsql', $drivers)) {
    echo "✅ pgsql driver is available<br>";
} else {
    echo "❌ pgsql driver is NOT available<br>";
}

// Test 3: Check DATABASE_URL environment variable
echo "<h2>Test 3: DATABASE_URL Environment Variable</h2>";
$databaseUrl = getenv('DATABASE_URL');
if ($databaseUrl) {
    echo "✅ DATABASE_URL is set<br>";
    echo "Value: " . htmlspecialchars($databaseUrl) . "<br>";
    
    // Parse and display connection details (hide password)
    $parsed = parse_url($databaseUrl);
    echo "<pre>";
    echo "Host: " . ($parsed['host'] ?? 'N/A') . "<br>";
    echo "Port: " . ($parsed['port'] ?? '5432') . "<br>";
    echo "Database: " . ltrim($parsed['path'] ?? '', '/') . "<br>";
    echo "User: " . ($parsed['user'] ?? 'N/A') . "<br>";
    echo "Password: " . (isset($parsed['pass']) ? '********' : 'Not set') . "<br>";
    echo "</pre>";
} else {
    echo "❌ DATABASE_URL is NOT set<br>";
}

// Test 4: Attempt actual database connection
echo "<h2>Test 4: Attempt Database Connection</h2>";
if ($databaseUrl) {
    try {
        $db = parse_url($databaseUrl);
        $host = $db['host'];
        $port = $db['port'] ?? '5432';
        $dbname = ltrim($db['path'], '/');
        $user = $db['user'];
        $pass = $db['pass'];
        
        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;";
        
        echo "Attempting to connect to PostgreSQL...<br>";
        $pdo = new PDO($dsn, $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        echo "✅ Successfully connected to PostgreSQL!<br>";
        
        // Test query
        $result = $pdo->query("SELECT version()")->fetch();
        echo "<br>PostgreSQL version: " . $result['version'] . "<br>";
        
        // List tables
        $tables = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")->fetchAll();
        echo "<br><strong>Tables in database:</strong><br>";
        if (count($tables) > 0) {
            echo "<ul>";
            foreach ($tables as $table) {
                echo "<li>" . $table['table_name'] . "</li>";
            }
            echo "</ul>";
        } else {
            echo "No tables found in the database.<br>";
        }
        
    } catch (Exception $e) {
        echo "❌ Connection failed: " . $e->getMessage() . "<br>";
    }
} else {
    echo "Cannot test connection because DATABASE_URL is not set.<br>";
}

// Test 5: PHP Info (useful for debugging)
echo "<h2>Test 5: Quick PHP Info</h2>";
echo "<details>";
echo "<summary>Click to view PHP version and extensions</summary>";
echo "PHP Version: " . phpversion() . "<br>";
echo "<br><strong>Loaded Extensions:</strong><br>";
$extensions = get_loaded_extensions();
sort($extensions);
echo "<ul>";
foreach ($extensions as $ext) {
    echo "<li>" . $ext . "</li>";
}
echo "</ul>";
echo "</details>";

echo "<br><br>";
echo "<hr>";
echo "<p><strong>Note:</strong> If you see errors, check your Render deployment logs for more details.</p>";
?>