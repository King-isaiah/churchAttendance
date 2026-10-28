<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Management | Hub Church</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
    
    <style>
        /* ===== BASE STYLES ===== */
        :root {
            --primary: #0d6efd;
            --primary-hover: #0b5ed7;
            --success: #198754;
            --success-hover: #157347;
            --danger: #dc3545;
            --bg-color: #f4f6f9;
            --text-main: #212529;
            --text-muted: #6c757d;
            --border-color: #dee2e6;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* ===== TOP NAVIGATION ===== */
        .top-nav {
            background: white;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border-bottom: 1px solid var(--border-color);
        }

        .top-nav h1 {
            font-size: 20px;
            color: var(--primary);
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .btn-back {
            text-decoration: none;
            color: var(--text-muted);
            background: #f8f9fa;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s;
            border: 1px solid var(--border-color);
        }

        .btn-back:hover {
            background: #e9ecef;
            color: var(--text-main);
        }

        /* ===== MAIN LAYOUT ===== */
        .container {
            max-width: 1000px;
            margin: 40px auto;
            padding: 0 20px;
            flex: 1;
        }

        .card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid var(--border-color);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 15px;
        }

        .card-header h2 {
            font-size: 22px;
            color: var(--text-main);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* ===== BUTTONS ===== */
        .btn {
            padding: 10px 20px;
            border-radius: 8px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 14px;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
        }

        .btn-primary:hover { background: var(--primary-hover); }

        .btn-success {
            background: var(--success);
            color: white;
        }

        .btn-success:hover { background: var(--success-hover); }

        .btn-secondary {
            background: #e9ecef;
            color: var(--text-main);
        }

        .btn-secondary:hover { background: #dde0e3; }

        /* ===== DROP ZONE ===== */
        .drop-zone {
            border: 2px dashed var(--primary);
            border-radius: 12px;
            padding: 50px 20px;
            text-align: center;
            background: #f8f9fa;
            cursor: pointer;
            transition: all 0.3s;
        }

        .drop-zone:hover, .drop-zone.dragover {
            background: #e7f1ff;
            border-color: var(--primary-hover);
            transform: translateY(-2px);
        }

        .drop-zone i {
            font-size: 48px;
            color: var(--primary);
            margin-bottom: 15px;
        }

        .drop-zone h4 { font-size: 18px; margin-bottom: 5px; }
        .drop-zone p { color: var(--text-muted); font-size: 14px; }

        /* ===== PREVIEW TABLE ===== */
        .preview-container {
            display: none;
            margin-top: 30px;
            animation: fadeIn 0.3s ease;
        }

        .preview-table-wrapper {
            max-height: 350px;
            overflow-y: auto;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            margin-top: 15px;
        }

        table.preview-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            text-align: left;
        }

        table.preview-table th {
            background: #f1f3f5;
            padding: 12px 15px;
            position: sticky;
            top: 0;
            font-weight: 600;
            border-bottom: 2px solid var(--border-color);
        }

        table.preview-table td {
            padding: 12px 15px;
            border-bottom: 1px solid var(--border-color);
        }

        /* ===== EXPORT GRID ===== */
        .export-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .export-card {
            background: #f8f9fa;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            transition: transform 0.2s;
        }

        .export-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        
        .export-card i { font-size: 32px; color: var(--primary); margin-bottom: 15px; }
        .export-card h3 { margin-bottom: 10px; font-size: 18px; }
        .export-card p { color: var(--text-muted); font-size: 14px; margin-bottom: 20px; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>

    <!-- Top Navigation -->
    <nav class="top-nav">
        <h1><i class="fas fa-database"></i> Data Management</h1>
        <a href="dashboard.php" class="btn-back"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
    </nav>

    <div class="container">
        <div id="toastifyContainer"></div>

        <!-- IMPORT SECTION -->
        <div class="card">
            <div class="card-header">
                <h2><i class="fas fa-file-import" style="color: var(--primary);"></i> Bulk Import</h2>
                <button class="btn btn-secondary" onclick="downloadTemplate()">
                    <i class="fas fa-download"></i> Download CSV Template
                </button>
            </div>
            
            <p style="color: var(--text-muted); margin-bottom: 20px;">Upload a CSV file containing your member data. Please use the template to ensure formatting is correct.</p>

            <div class="drop-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
                <i class="fas fa-cloud-upload-alt"></i>
                <h4>Drag & Drop your CSV file here</h4>
                <p>or click to browse</p>
                <input type="file" id="fileInput" accept=".csv" style="display: none;" onchange="handleFileSelect(event)">
            </div>

            <!-- Preview Area -->
            <div id="previewSection" class="preview-container">
                <h3>Preview Data</h3>
                <div id="previewError" style="color: var(--danger); font-weight: 500;"></div>
                <div class="preview-table-wrapper">
                    <table class="preview-table" id="previewTable">
                        <thead id="previewHead"></thead>
                        <tbody id="previewBody"></tbody>
                    </table>
                </div>
                <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="btn btn-secondary" onclick="cancelImport()">Cancel</button>
                    <button class="btn btn-success" id="confirmImportBtn" onclick="submitImport()">Confirm Import</button>
                </div>
            </div>
        </div>

        <!-- EXPORT SECTION -->
        <div class="card">
            <div class="card-header">
                <h2><i class="fas fa-file-export" style="color: var(--success);"></i> Bulk Export</h2>
            </div>
            <p style="color: var(--text-muted);">Download your database records as clean CSV files (Unique internal IDs are omitted for security).</p>

            <div class="export-grid">
                <div class="export-card">
                    <i class="fas fa-users"></i>
                    <h3>Members</h3>
                    <p>Export all registered members and their contact details.</p>
                    <button class="btn btn-primary" onclick="exportData('members')">Export Members</button>
                </div>
                <div class="export-card">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>Events</h3>
                    <p>Export the list of all events in the system.</p>
                    <button class="btn btn-primary" onclick="exportData('events')">Export Events</button>
                </div>
                <div class="export-card">
                    <i class="fas fa-check-circle"></i>
                    <h3>Attendance</h3>
                    <p>Export all attendance records and timestamps.</p>
                    <button class="btn btn-primary" onclick="exportData('attendance')">Export Attendance</button>
                </div>
            </div>
        </div>
    </div>

    <script src="js/data-management.js"></script>
</body>
</html>