<?php
    // session_start();
    include "class/Member.php";
    // include "../class/ApiHandler.php";

    if (isset($_SESSION['user_id'])) {
        header('Location: user_dashboard.php');
        exit();
    }

    $error = '';
    $success = '';

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['login'])) {
            $email = $_POST['email'];
            $password = $_POST['password'];
            
            $member = new Member();
            $user = $member->authenticate($email, $password);
            
            if ($user) {
                $_SESSION['unique_id'] = $user['unique_id'];
                $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_department'] = $user['department_name'];
                // $_SESSION['user_role'] = 'user';
                echo  $_SESSION['unique_id'] ;
                echo  $_SESSION['user_name'] ;
                echo  $_SESSION['user_email'] ;
                echo  $_SESSION['user_department'] ;
            
                
                header('Location: user_dashboard.php');
                exit();
            } else {
                $error = 'Invalid email or password';
            }
        }
        
        // if (isset($_POST['register'])) {
        //     $memberData = [
        //         'first_name' => $_POST['first_name'],
        //         'last_name' => $_POST['last_name'],
        //         'email' => $_POST['email'],
        //         'phone' => $_POST['phone'],
        //         'password' => password_hash($_POST['password'], PASSWORD_DEFAULT),
        //         'department_id' => $_POST['department_id'] ?? null
        //     ];
            
        //     $member = new Member();
        //     try {
        //         $memberId = $member->createMember($memberData);
        //         $success = 'Registration successful! Please login.';
        //     } catch (Exception $e) {
        //         $error = $e->getMessage();
        //     }
        // }
    }
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Hub Church</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/auth.css">
    <link rel="stylesheet" href="../fontawesome/css/all.min.css">
</head>
<body class="auth-body">
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <img src="images/test.jpg" alt="Hub Church" class="auth-logo">
                <h2>Hub Church Attendance</h2>
                <p>Welcome back! Please sign in to your account</p>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-error"><?php echo $error; ?></div>
            <?php endif; ?>
            
            <?php if ($success): ?>
                <div class="alert alert-success"><?php echo $success; ?></div>
            <?php endif; ?>

            <!-- Login Form -->
            <form id="loginForm" method="POST" style="display: block;">
                <input type="hidden" name="login" value="1">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="btn-primary btn-full">Sign In</button>
            </form>

            <!-- Registration Form -->
            <!-- <form id="registerForm" method="POST" style="display: none;">
                <input type="hidden" name="register" value="1">
                <div class="form-row">
                    <div class="form-group">
                        <label for="reg_first_name">First Name</label>
                        <input type="text" id="reg_first_name" name="first_name" required>
                    </div>
                    <div class="form-group">
                        <label for="reg_last_name">Last Name</label>
                        <input type="text" id="reg_last_name" name="last_name" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="reg_email">Email Address</label>
                    <input type="email" id="reg_email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="reg_phone">Phone Number</label>
                    <input type="tel" id="reg_phone" name="phone">
                </div>
                <div class="form-group">
                    <label for="reg_password">Password</label>
                    <input type="password" id="reg_password" name="password" required>
                </div>
                <div class="form-group">
                    <label for="reg_department">Department (Optional)</label>
                    <select id="reg_department" name="department_id">
                        <option value="">Select Department</option>
                        <?php
                        $dept = new Department();
                        $departments = $dept->getAllDepartments();
                        foreach($departments as $department): ?>
                            <option value="<?php echo $department['id']; ?>">
                                <?php echo htmlspecialchars($department['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <button type="submit" class="btn-primary btn-full">Create Account</button>
            </form> -->

            <div class="auth-footer">
                <p>
                    <a href="#" id="toggleRegister">Don't have an account? Sign up</a>
                    <a href="#" id="toggleLogin" style="display: none;">Already have an account? Sign in</a>
                </p>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('toggleRegister').addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
            this.style.display = 'none';
            document.getElementById('toggleLogin').style.display = 'inline';
        });

        document.getElementById('toggleLogin').addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
            this.style.display = 'none';
            document.getElementById('toggleRegister').style.display = 'inline';
        });
    </script>
</body>
</html>