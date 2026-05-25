-- =============================================
-- IT Help Desk & Ticketing Management System
-- Database Schema — SQL Server
-- =============================================

-- 1. Role
CREATE TABLE Role (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL
);
INSERT INTO Role (Name) VALUES ('Admin'),('IT Support Agent'),('Employee'),('Manager');

-- 2. User
CREATE TABLE [User] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    RoleID INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_User_Role FOREIGN KEY (RoleID) REFERENCES Role(ID)
);

-- 3. SystemSetting
CREATE TABLE SystemSetting (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    WorkingDays NVARCHAR(100) NOT NULL,
    WorkingHours NVARCHAR(100) NOT NULL,
    Holidays NVARCHAR(MAX) NULL
);

-- 4. Category
CREATE TABLE Category (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL
);
INSERT INTO Category (Name) VALUES
('Hardware'),('Software'),('Network'),('Email'),('Access Request'),('Other');

-- 5. Priority
CREATE TABLE Priority (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL
);
INSERT INTO Priority (Name) VALUES ('Low'),('Medium'),('High'),('Critical');

-- 6. Status
CREATE TABLE Status (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL
);
INSERT INTO Status (Name) VALUES
('Open'),('In Progress'),('Pending'),('Resolved'),('Closed');

-- 7. Ticket
CREATE TABLE Ticket (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    ReferenceNumber NVARCHAR(50) NOT NULL UNIQUE,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    StatusID INT NOT NULL,
    PriorityID INT NOT NULL,
    CategoryID INT NOT NULL,
    CreatedByID INT NOT NULL,
    AssignedToID INT NULL,
    CONSTRAINT FK_Ticket_Status FOREIGN KEY (StatusID) REFERENCES Status(ID),
    CONSTRAINT FK_Ticket_Priority FOREIGN KEY (PriorityID) REFERENCES Priority(ID),
    CONSTRAINT FK_Ticket_Category FOREIGN KEY (CategoryID) REFERENCES Category(ID),
    CONSTRAINT FK_Ticket_CreatedBy FOREIGN KEY (CreatedByID) REFERENCES [User](ID),
    CONSTRAINT FK_Ticket_AssignedTo FOREIGN KEY (AssignedToID) REFERENCES [User](ID)
);

-- 8. TicketComment
CREATE TABLE TicketComment (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    TicketID INT NOT NULL,
    UserID INT NOT NULL,
    CONSTRAINT FK_Comment_Ticket FOREIGN KEY (TicketID) REFERENCES Ticket(ID),
    CONSTRAINT FK_Comment_User FOREIGN KEY (UserID) REFERENCES [User](ID)
);

-- 9. TicketAttachment
CREATE TABLE TicketAttachment (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    FileName NVARCHAR(255) NOT NULL,
    FilePath NVARCHAR(500) NOT NULL,
    UploadedAt DATETIME NOT NULL DEFAULT GETDATE(),
    TicketID INT NOT NULL,
    CONSTRAINT FK_Attachment_Ticket FOREIGN KEY (TicketID) REFERENCES Ticket(ID)
);

-- 10. Notification
CREATE TABLE Notification (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Message NVARCHAR(500) NOT NULL,
    IsRead BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UserID INT NOT NULL,
    TicketID INT NULL,
    CONSTRAINT FK_Notification_User FOREIGN KEY (UserID) REFERENCES [User](ID),
    CONSTRAINT FK_Notification_Ticket FOREIGN KEY (TicketID) REFERENCES Ticket(ID)
);

-- 11. ActivityLog
CREATE TABLE ActivityLog (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Action NVARCHAR(255) NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT GETDATE(),
    UserID INT NOT NULL,
    TicketID INT NOT NULL,
    CONSTRAINT FK_Log_User FOREIGN KEY (UserID) REFERENCES [User](ID),
    CONSTRAINT FK_Log_Ticket FOREIGN KEY (TicketID) REFERENCES Ticket(ID)
);
