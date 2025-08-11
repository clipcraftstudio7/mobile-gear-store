# Authentication System Documentation

## Overview

The Mobile Gear Hub uses Supabase for authentication, providing a secure and scalable user management system.

## Features Implemented

### 🔐 **User Authentication**

- **Login/Signup**: Toggle between login and signup modes
- **Email Verification**: Automatic email verification for new accounts
- **Password Reset**: Forgot password functionality with email reset links
- **Session Management**: Persistent login sessions
- **Secure Logout**: Proper session cleanup

### 👤 **User Profile Management**

- **Profile Page**: Complete user profile management (`/profile.html`)
- **Profile Data**: Name, username, bio, phone, location
- **Avatar System**: Automatic initials-based avatars
- **Profile Statistics**: Orders, wishlist, reviews counters

### 🛒 **Cart Integration**

- **Persistent Cart**: Cart data synced with user account
- **Local Storage**: Offline cart functionality
- **Database Sync**: Cart data stored in Supabase
- **Cart Modal**: Interactive shopping cart interface

### 🎨 **UI/UX Features**

- **Loading States**: Visual feedback during authentication
- **Error Handling**: User-friendly error messages
- **Success Notifications**: Toast notifications for actions
- **Responsive Design**: Mobile-friendly interface

## Database Schema

### Profiles Table

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  phone TEXT,
  location TEXT,
  email TEXT,
  orders_count INTEGER DEFAULT 0,
  wishlist_count INTEGER DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Carts Table

```sql
CREATE TABLE carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## File Structure

```
mobile-gaming-store/
├── login.html              # Authentication page
├── profile.html            # User profile management
├── assets/js/
│   ├── main.js            # Main app logic + auth UI
│   └── cart.js            # Cart management system
└── AUTHENTICATION.md       # This documentation
```

## Authentication Flow

### 1. **Login Process**

```
User enters credentials → Supabase validates → Session created → UI updates → Redirect to home
```

### 2. **Signup Process**

```
User enters details → Account created → Email verification sent → User verifies → Login enabled
```

### 3. **Profile Management**

```
User accesses profile → Data loaded from Supabase → User edits → Changes saved → UI updated
```

### 4. **Cart Integration**

```
User adds item → Cart updated locally → Synced to database → UI reflects changes
```

## Security Features

- **Email Verification**: Required for new accounts
- **Secure Password Storage**: Handled by Supabase
- **Session Management**: Automatic token refresh
- **CSRF Protection**: Built into Supabase
- **Rate Limiting**: Supabase handles abuse prevention

## User Experience

### **Logged Out State**

- Login button visible
- Cart works locally (localStorage)
- Limited functionality

### **Logged In State**

- User avatar and name displayed
- Profile link available
- Cart synced with database
- Full functionality enabled

## API Endpoints Used

### Authentication

- `supabase.auth.signUp()` - Create new account
- `supabase.auth.signInWithPassword()` - Login
- `supabase.auth.signOut()` - Logout
- `supabase.auth.resetPasswordForEmail()` - Password reset

### Profile Management

- `supabase.from('profiles').select()` - Get profile
- `supabase.from('profiles').upsert()` - Update profile

### Cart Management

- `supabase.from('carts').select()` - Get cart
- `supabase.from('carts').upsert()` - Update cart

## Error Handling

### Common Error Messages

- **Invalid credentials**: "Invalid login credentials"
- **Email not verified**: "Please verify your email address"
- **Network issues**: "Connection error. Please try again"
- **Profile errors**: "Error updating profile. Please try again"

### User Feedback

- **Success notifications**: Green toast messages
- **Error notifications**: Red toast messages
- **Loading states**: Button text changes and spinners
- **Form validation**: Real-time input validation

## Future Enhancements

### Planned Features

- [ ] Social login (Google, Facebook)
- [ ] Two-factor authentication
- [ ] Order history integration
- [ ] Wishlist functionality
- [ ] User reviews system
- [ ] Email preferences
- [ ] Address management

### Technical Improvements

- [ ] Offline mode support
- [ ] Push notifications
- [ ] Advanced profile customization
- [ ] Multi-language support
- [ ] Dark/light theme toggle

## Testing

### Manual Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Signup with new email
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Profile editing
- [ ] Cart functionality
- [ ] Logout process
- [ ] Session persistence
- [ ] Responsive design

## Deployment Notes

### Environment Variables

```javascript
SUPABASE_URL = "https://kokntkhxkymllafuubun.supabase.co";
SUPABASE_ANON_KEY = "your-anon-key-here";
```

### Required Supabase Setup

1. Enable Email Auth in Supabase Dashboard
2. Configure email templates
3. Set up Row Level Security (RLS)
4. Create database tables
5. Configure redirect URLs

## Support

For authentication issues:

- Check browser console for errors
- Verify Supabase connection
- Ensure email verification is complete
- Clear browser cache if needed

---

**Last Updated**: July 2025
**Version**: 1.0.0
