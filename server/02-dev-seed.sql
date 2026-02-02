
-- Initial seed for development (Fictional data)
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`) VALUES 
(1, 'admin', '$2b$10$3PLAgnQkJpuJu0HA5lmVOOiacYwHQko5ouCrP0J1KL/l7zaDhs.5G', 'admin'),
(2, 'dr_house', '$2b$10$YourDoctorHashHere', 'doctor'),
(3, 'sec_mary', '$2b$10$YourSecretaryHashHere', 'secretary'),
(4, 'patient_zero', '$2b$10$YourPatientHashHere', 'patient');

INSERT INTO `doctors` (`id`, `user_id`, `full_name`, `specialty`, `consultation_price`) VALUES 
(10, 2, 'Gregory House', 'Diagnostic Medicine', 5000.00);

INSERT INTO `secretaries` (`id`, `user_id`, `full_name`) VALUES 
(1, 3, 'Mary Smith');

INSERT INTO `patients` (`id`, `user_id`, `full_name`, `is_new_patient`) VALUES 
(1, 4, 'John Doe', 1);

INSERT INTO `consultorios` (`id`, `name`, `status`) VALUES 
(1, 'Consultorio A', 'available'),
(2, 'Consultorio B', 'available');
