-- =============================================
-- IT Help Desk & Ticketing Management System
-- Database Schema — MySQL
-- =============================================

-- 1. Role
CREATE TABLE Role (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL
);
INSERT INTO Role (Name) VALUES ('Admin'),('IT Support Agent'),('Employee'),('Manager');

-- 2. User
CREATE TABLE `User` (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    IsActive TINYINT NOT NULL DEFAULT 1,
    RoleID INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (RoleID) REFERENCES Role(ID)
);

-- 3. SystemSetting
CREATE TABLE SystemSetting (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    WorkingDays VARCHAR(100) NOT NULL,
    WorkingHours VARCHAR(100) NOT NULL,
    Holidays TEXT NULL
);

-- 4. Category
CREATE TABLE Category (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL
);
INSERT INTO Category (Name) VALUES ('Hardware'),('Software'),('Network'),('Email'),('Access Request'),('Other');

-- 5. Priority
CREATE TABLE Priority (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL
);
INSERT INTO Priority (Name) VALUES ('Low'),('Medium'),('High'),('Critical');

-- 6. Status
CREATE TABLE `Status` (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(50) NOT NULL
);
INSERT INTO `Status` (Name) VALUES ('Open'),('In Progress'),('Pending'),('Resolved'),('Closed');

-- 7. Ticket
CREATE TABLE Ticket (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ReferenceNumber VARCHAR(50) NOT NULL UNIQUE,
    Title VARCHAR(200) NOT NULL,
    Description TEXT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    StatusID INT NOT NULL,
    PriorityID INT NOT NULL,
    CategoryID INT NOT NULL,
    CreatedByID INT NOT NULL,
    AssignedToID INT NULL,
    FOREIGN KEY (StatusID) REFERENCES `Status`(ID),
    FOREIGN KEY (PriorityID) REFERENCES Priority(ID),
    FOREIGN KEY (CategoryID) REFERENCES Category(ID),
    FOREIGN KEY (CreatedByID) REFERENCES `User`(ID),
    FOREIGN KEY (AssignedToID) REFERENCES `User`(ID)
);

-- 8. TicketComment
CREATE TABLE TicketComment (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Content TEXT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TicketID INT NOT NULL,
    UserID INT NOT NULL,
    FOREIGN KEY (TicketID) REFERENCES Ticket(ID),
    FOREIGN KEY (UserID) REFERENCES `User`(ID)
);

-- 9. TicketAttachment
CREATE TABLE TicketAttachment (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    FileName VARCHAR(255) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    UploadedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TicketID INT NOT NULL,
    FOREIGN KEY (TicketID) REFERENCES Ticket(ID)
);

-- 10. Notification
CREATE TABLE Notification (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Message VARCHAR(500) NOT NULL,
    IsRead TINYINT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UserID INT NOT NULL,
    TicketID INT NULL,
    FOREIGN KEY (UserID) REFERENCES `User`(ID),
    FOREIGN KEY (TicketID) REFERENCES Ticket(ID)
);

-- 11. ActivityLog
CREATE TABLE ActivityLog (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Action VARCHAR(255) NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UserID INT NOT NULL,
    TicketID INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES `User`(ID),
    FOREIGN KEY (TicketID) REFERENCES Ticket(ID)
);
