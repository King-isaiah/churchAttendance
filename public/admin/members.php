<?php
include "include/header.php";
include "class/Member.php";
include "class/Department.php";

// Create instances
$member = new Member();
$department = new Department();

// Get data from database
$members = $member->getAllMembers();
$departments = $department->getAllDepartments();
?>

<head>
    <link rel="stylesheet" href="css/members.css">      
</head>

<div class="page-header">
    <h2>Member Management</h2>
    <button class="btn-primary" onclick="openMemberModal()">
        <i class="fas fa-plus"></i> Add Member
    </button>
</div>

<!-- REVERTED: Original search bar and dropdown -->
<div class="search-bar">
    <input type="text" id="memberSearch" placeholder="🔍 Search members..." onkeyup="searchMembers()">
    <select id="departmentFilter" onchange="filterMembers()">
        <option value="">All Departments</option>
        <?php foreach($departments as $dept): ?>
            <option value="<?php echo $dept['id']; ?>"><?php echo htmlspecialchars($dept['name']); ?></option>
        <?php endforeach; ?>
    </select>
</div>

<div class="table-container">
    <table class="data-table">
        <thead>
            <tr>
                <th>UserName</th>
                <th>FullName</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Join Date</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="memberTable">
            <?php if (!empty($members)): ?>
                <?php foreach ($members as $member): ?>
                    <tr data-member-id="<?php echo $member['id']; ?>">
                        <td><?php echo htmlspecialchars($member['user_name']); ?></td>
                        <td><?php echo htmlspecialchars($member['first_name'] . ' ' . $member['last_name']); ?></td>
                        <td><?php echo htmlspecialchars($member['email'] ?? 'N/A'); ?></td>
                        <td><?php echo htmlspecialchars($member['phone'] ?? 'N/A'); ?></td>
                        <td>
                            <span class="department-badge"><?php echo htmlspecialchars($member['department_name'] ?? 'No Department'); ?></span>
                        </td>
                        <td><?php echo date('M j, Y', strtotime($member['join_date'] ?? $member['created_at'])); ?></td>
                        <td class="action-buttons">
                            <button class="btn-icon" onclick="editMember(<?php echo $member['id']; ?>)">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-danger" onclick="deleteMember(<?php echo $member['id']; ?>)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php else: ?>
                <tr>
                    <td colspan="6" class="no-data">No members found</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
    
    
    <div class="pagination" id="pagination">
       
    </div>
</div>


<div id="memberModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="modalTitle">Add New Member</h3>
            <span class="close" onclick="closeMemberModal()">&times;</span>
        </div>
        <div class="modal-body">
            <form id="memberForm" onsubmit="return handleMemberSubmit(event)">
                <input type="hidden" id="memberId" name="id">
                <!-- <div class="form-group">
                
                    <input type="hidden" id="unique_id" name="unique_id" required>
                </div> -->
                <div class="form-group">
                    <label>User Name *</label>
                    <input type="text" id="userName" name="user_name" required>
                </div>
                <div class="form-group">
                    <label>First Name *</label>
                    <input type="text" id="firstName" name="first_name" required>
                </div>
                <div class="form-group">
                    <label>Last Name *</label>
                    <input type="text" id="lastName" name="last_name" required>
                </div>
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" id="phone" name="phone">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="password" name="password">
                </div>
              
                <div class="department-selection">    
                    <div class="form-group department-field" id="departmentField1">
                        <div class="form-group">
                            <label for="memberDepartment1">Department</label>
                            <select id="memberDepartment1" name="department_id" class="department-select">
                                <option value="">Select Departments</option>
                                <?php foreach ($departments as $dept): ?>
                                    <option value="<?php echo $dept['id']; ?>">
                                        <?php echo htmlspecialchars($dept['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <button type="button" class="remove-department" onclick="removeDepartmentField(this)" style="display: none;">−</button>
                    </div>
                    
                    
                    <div id="additionalDepartments"></div>
                    <button type="button" id="addDepartmentBtn" onclick="addDepartmentField()" class="add-department-btn">
                        + Add Another Department
                    </button>
                    <small class="hint">Maximum 3 departments total</small>

                </div>
                <div class="form-group">
                    <label>Join Date</label>
                    <input type="date" id="joinDate" name="join_date">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeMemberModal()">Cancel</button>
                    <button type="submit" class="btn-primary" id="submitButton">Add Member</button>
                </div>
            </form>
        </div>
    </div>
</div>
<script> 
    
let departmentCounter = 1;
const maxDepartments = 3;

function addDepartmentField() {
    if (departmentCounter >= maxDepartments) {
        document.getElementById('addDepartmentBtn').disabled = true;
        alert('Maximum of 3 departments reached');
        return;
    }
    
    departmentCounter++;
    const container = document.getElementById('additionalDepartments');
  
    const selectedDepartments = [];
    document.querySelectorAll('.department-select').forEach(select => {
        const value = parseInt(select.value);
        if (value && value > 0) { 
            selectedDepartments.push(value);
        }
    });    
    
    const allDepartments = <?php echo json_encode($departments); ?>;
    
    // Create new department field
    const newField = document.createElement('div');
    newField.className = 'form-group department-field';
    newField.id = 'departmentField' + departmentCounter;
   
    let optionsHTML = '<option value=""></option>'; 
    allDepartments.forEach(dept => {
        if (!selectedDepartments.includes(dept.id)) {
            optionsHTML += `<option value="${dept.id}">${escapeHtml(dept.name)}</option>`;
        }
    });
    
    newField.innerHTML = `
        <div class="form-group">
            <label for="memberDepartment${departmentCounter}">Select A Department</label>
            <select id="memberDepartment${departmentCounter}" name="department_id" class="department-select">
                ${optionsHTML}
            </select>
        </div>
        <button type="button" class="remove-department" onclick="removeDepartmentField(this)">−</button>
    `;
    
    container.appendChild(newField);
    
    // Show remove button on first field
    if (departmentCounter === 2) {
        document.querySelector('#departmentField1 .remove-department').style.display = 'block';
    }
    
    // Disable button if max reached
    if (departmentCounter >= maxDepartments) {
        document.getElementById('addDepartmentBtn').disabled = true;
    }
}

// function removeDepartmentField(button) {
//     const field = button.closest('.department-field');
//     const fieldToNotDelete = document.querySelector('#departmentField1');
    
//     // Don't remove the first one
//     if (field.id === 'departmentField1') {      
//         field.querySelector('select').value = '';
//         return;
//     }
    
//     field.remove();
//     departmentCounter--;
    
//     if (departmentCounter === 1) {
//         document.querySelector('#departmentField1 .remove-department').style.display = 'none';
//     }
    
//     document.getElementById('addDepartmentBtn').disabled = false;
    
//     // Update all department selects to show newly available options
//     refreshDepartmentSelects();
 
//     renumberDepartmentFields();
// }
function removeDepartmentField(button) {
    const field = button.closest('.department-field');     
    const firstField = document.querySelector('#departmentField1');
    const fieldToDelete = document.querySelector('#additionalDepartments');
    
    // Don't remove the first one
    if (field.id === 'departmentField1') {      
        field.querySelector('select').textContent = 'select department';
        return;
    }
    
    //  if (fieldToDelete) {           
    //     field.remove(); 
    //     return; 
    // }
  
    field.remove();
    departmentCounter--;
    
    if (departmentCounter === 1) {
        document.querySelector('#departmentField1 .remove-department').style.display = 'none';
    }
    
    document.getElementById('addDepartmentBtn').disabled = false;
    
    // Update all department selects to show newly available options
    refreshDepartmentSelects();
 
    renumberDepartmentFields();
}

function refreshDepartmentSelects() {
    // Get all currently selected department IDs
    const selectedDepartments = [];
    document.querySelectorAll('.department-select').forEach(select => {
        const value = parseInt(select.value);
        if (value && value > 0) {
            selectedDepartments.push(value);
        }
    });
    
    const allDepartments = <?php echo json_encode($departments); ?>;
    
    // Update each select dropdown
    document.querySelectorAll('.department-select').forEach(select => {
        const currentValue = select.value;
        
        select.innerHTML = '<option value=""></option>';
     
        allDepartments.forEach(dept => {         
            if (parseInt(currentValue) === dept.id || !selectedDepartments.includes(dept.id)) {
                select.innerHTML += `<option value="${dept.id}">${escapeHtml(dept.name)}</option>`;
            }
        });
        
        // Restore the current value
        select.value = currentValue;
    });
}

function renumberDepartmentFields() {
    const fields = document.querySelectorAll('.department-field');
    let newCounter = 1;
    
    fields.forEach((field, index) => {
        if (index === 0) return; // Skip first field
        
        const select = field.querySelector('select');
        const label = field.querySelector('label');
        const removeBtn = field.querySelector('.remove-department');
        
        // Update IDs
        field.id = 'departmentField' + newCounter;
        select.id = 'memberDepartment' + newCounter;
        label.setAttribute('for', 'memberDepartment' + newCounter);
        
        // Update remove button onclick
        removeBtn.setAttribute('onclick', 'removeDepartmentField(this)');
        
        newCounter++;
    });
}

// Initialize - hide remove button on first field
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#departmentField1 .remove-department').style.display = 'none';
});
</script>
<script src="js/main.js"></script>
<script src="js/members.js"></script>
<?php include "include/footer.php"; ?>