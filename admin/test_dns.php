<?php
$domain = 'thisdomainisnotreal12345.com';
var_dump(checkdnsrr($domain, 'MX')); // Should be false
var_dump(checkdnsrr($domain, 'A'));  // If this is true, your ISP is hijacking
?>