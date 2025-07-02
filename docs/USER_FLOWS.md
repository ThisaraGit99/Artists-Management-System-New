# User Flows Documentation

## Artist Flows

### 1. Artist Registration & Profile Setup
```mermaid
graph TD
    A[Start] --> B[Register Account]
    B --> C[Email Verification]
    C --> D[Complete Basic Profile]
    D --> E[Add Portfolio]
    E --> F[Set Availability]
    F --> G[Add Skills & Rates]
    G --> H[Profile Review]
    H --> I[Profile Approved]
```

### 2. Artist Booking Flow
```mermaid
graph TD
    A[Browse Events] --> B[View Event Details]
    B --> C[Apply for Event]
    C --> D[Receive Booking Request]
    D --> E{Accept/Reject}
    E -->|Accept| F[Confirm Details]
    F --> G[Receive Payment]
    G --> H[Perform at Event]
    H --> I[Get Review]
    E -->|Reject| J[End]
```

## Organizer Flows

### 1. Event Creation Flow
```mermaid
graph TD
    A[Create Event] --> B[Set Event Details]
    B --> C[Set Requirements]
    C --> D[Set Budget]
    D --> E[Review & Publish]
    E --> F[Receive Applications]
    F --> G[Review Artists]
    G --> H[Select Artists]
    H --> I[Make Payment]
```

### 2. Booking Management Flow
```mermaid
graph TD
    A[View Bookings] --> B[Check Artist Details]
    B --> C[Review Portfolio]
    C --> D{Make Decision}
    D -->|Accept| E[Send Booking Request]
    E --> F[Make Payment]
    F --> G[Confirm Booking]
    D -->|Reject| H[End]
```

## Admin Flows

### 1. User Verification Flow
```mermaid
graph TD
    A[View Pending Verifications] --> B[Check User Details]
    B --> C[Review Documents]
    C --> D{Make Decision}
    D -->|Approve| E[Update Status]
    E --> F[Send Notification]
    D -->|Reject| G[Send Feedback]
```

### 2. Dispute Resolution Flow
```mermaid
graph TD
    A[Receive Dispute] --> B[Review Details]
    B --> C[Contact Parties]
    C --> D[Investigate]
    D --> E{Resolution}
    E -->|Resolved| F[Update Status]
    F --> G[Process Refund if needed]
    E -->|Escalate| H[Higher Review]
```

## Payment Flows

### 1. Standard Payment Flow
```mermaid
graph TD
    A[Initiate Payment] --> B[Select Method]
    B --> C[Process Payment]
    C --> D{Status}
    D -->|Success| E[Update Booking]
    E --> F[Send Confirmation]
    D -->|Failure| G[Retry/Cancel]
```

### 2. Refund Flow
```mermaid
graph TD
    A[Request Refund] --> B[Review Request]
    B --> C{Eligible?}
    C -->|Yes| D[Process Refund]
    D --> E[Update Records]
    E --> F[Notify Users]
    C -->|No| G[Send Rejection]
```

## Review System Flow

### 1. Review Submission Flow
```mermaid
graph TD
    A[Event Completed] --> B[Prompt for Review]
    B --> C[Submit Rating]
    C --> D[Add Comments]
    D --> E[Process Review]
    E --> F[Update Profiles]
    F --> G[Notify Users]
```

## Notification Flows

### 1. System Notifications
```mermaid
graph TD
    A[Event Trigger] --> B[Create Notification]
    B --> C[Format Message]
    C --> D[Select Channel]
    D --> E[Send Notification]
    E --> F[Track Delivery]
    F --> G[Mark as Read]
```

## Error Handling Flows

### 1. Error Resolution Flow
```mermaid
graph TD
    A[Error Occurs] --> B[Log Error]
    B --> C[Categorize]
    C --> D{Type?}
    D -->|User| E[Show Message]
    D -->|System| F[Alert Admin]
    F --> G[Apply Fix]
    G --> H[Monitor]
``` 