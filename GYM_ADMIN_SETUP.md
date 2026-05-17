# GainAi Gym Admin System Setup

## Overview

The Gym Admin system is a complete management interface for gym owners to manage their members, track statistics, and generate invite links. It includes authentication, dashboard analytics, member management, and an invite flow for gym members.

## Implementation Details

### THING 1: Navbar Integration

**File**: `components/navbar.tsx`

The navbar now includes a "Gym Admin" link that appears only on the home page (`/`) when the user is not logged in. It follows the same styling as other navigation links.

- **Visibility**: Home page only (`pathname === "/"`)
- **Auth State**: Only shows when user is NOT logged in
- **Responsive**: Works on both desktop and mobile views
- **Link Target**: `/gym-admin`

### THING 2: Gym Admin Dashboard

**File**: `app/gym-admin/page.tsx`

A comprehensive single-page application with three main sections:

#### Authentication States

**Not Logged In:**
- Centered card with GainAi logo
- Two tabs: Login and Sign Up
- Login form with email/password
- Multi-step signup flow:
  - Step 1: Full name, Phone number (+91 format)
  - Step 2: Gym name, Location, Optional logo upload
  - Step 3: Email, Password, Confirm password
- Creates `gyms` table entry on signup

**Logged In with Gym:**
- Dark sidebar layout (desktop): `bg-[#0f1318]` with white text
- Mobile bottom navigation tabs
- Three main sections: Dashboard, Members, Settings

#### Dashboard Section

**Statistics Cards** (4 columns, responsive):
- Total Members (count of all gym_members)
- Active Members (is_active = true)
- Blocked Members (is_active = false)
- Status (shows "Active")

**Invite Link Card**:
- Copyable URL: `https://gain-ai.vercel.app/join/{gym-slug}`
- Green "Copy Link" button with "Copied!" feedback (2 sec)
- "Generate QR Code" button using `https://api.qrserver.com/v1/create-qr-code/`
- QR code image display with "Download QR Code" button
- Gym slug displayed in muted text

**Quick Stats Card**:
- Members joined this week
- Members joined this month
- Total scans this week

**Recent Members Table**:
- Last 5 members with Name, Phone, Joined Date, Status badge
- "View All →" link to Members section

#### Members Section

**Header**:
- "Members" title
- Green "Add Member" button
- Mobile responsive layout

**Search**:
- Filter by name or phone number (real-time)

**Members Table**:
- Columns: Name, Phone, Status (badge), Joined Date, Actions
- Actions: Block/Unblock toggle, Remove button (with confirmation)
- Status badges: Green for Active, Red for Blocked

**Add Member Modal**:
- Name input
- Phone input (+91 prefix validation)
- Submits to `gym_members` table
- Duplicate phone detection

**Bulk Upload Modal**:
- CSV file upload
- Expected format: Name, Phone
- Example display shown in modal
- Batch insert with success count

#### Settings Section

**Gym Details Card**:
- Read-only fields: Gym Name, Location, Phone
- Note about contacting support for updates

**Subscription Status Card**:
- Current plan (Trial/Active)
- Subscription end date
- "Contact Support to Upgrade" button

**Danger Zone Card**:
- Red outline Logout button

#### Styling & Design

- **Color Scheme**:
  - Primary Green: `#00ff88` (accent color)
  - Green Gradient Buttons: `from-[#00ff88] to-[#00cc6a]`
  - Dark Sidebar: `bg-[#0f1318]`
  - Uses semantic tokens: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`

- **Responsive Design**:
  - Desktop: Fixed width sidebar (240px) with full content area
  - Mobile: Full-width with hamburger menu that shows/hides nav tabs
  - Grid layouts scale down gracefully

- **Dark/Light Mode**:
  - Full support via semantic CSS variables
  - Dark sidebar uses `bg-[#0f1318]` with white text
  - All text colors automatically adjust via tokens

#### Database Tables Required

```sql
-- Gyms table
CREATE TABLE gyms (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  name VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  owner_name VARCHAR(255),
  phone VARCHAR(20),
  location VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gym Members table
CREATE TABLE gym_members (
  id UUID PRIMARY KEY,
  gym_id UUID REFERENCES gyms(id),
  user_id UUID REFERENCES auth.users(id) NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(gym_id, phone)
);

-- Food Scans table (for stats)
CREATE TABLE food_scans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### THING 3: Member Invite Page

**File**: `app/join/[slug]/page.tsx`

Two-step flow for gym members to join via invite link:

#### Step 1: Check Access
- Full Name input
- Phone number input (+91 format)
- "Check Access" button
- Queries `gym_members` table for matching phone number with `is_active = true`
- Shows success or error message

#### Step 2: Create Account
- Email input
- Password input
- Confirm Password input
- "Create Account" button
- Calls `supabase.auth.signUp()`
- Updates `gym_members.user_id` after successful signup
- Redirects to `/dashboard`

#### Error Handling
- Shows "Invalid or expired invite link" if gym slug not found
- Shows "Your number isn't on the list..." if phone not in members
- Proper error messages and validation

## Features

✅ Complete gym owner authentication  
✅ Multi-step onboarding for gym creation  
✅ Dashboard with real-time statistics  
✅ Member management (add, block, remove, search)  
✅ Bulk CSV member upload  
✅ QR code generation for invite links  
✅ Copy-to-clipboard invite URL  
✅ Member invite link flow  
✅ Phone-based member verification  
✅ Account creation from invite  
✅ Dark/Light mode support  
✅ Fully responsive mobile design  
✅ Sidebar navigation (desktop) with mobile tabs  

## How to Use

### For Gym Owners

1. **Sign Up**: Visit `/gym-admin` and click "Sign Up"
2. **Create Gym**: Follow 3-step signup (info → gym → password)
3. **Share Invite**: Copy the invite link or QR code from Dashboard
4. **Manage Members**: Add members manually or bulk upload CSV
5. **Monitor Stats**: Track active members, joined dates, scans

### For Members

1. **Click Invite Link**: Receive `https://gain-ai.vercel.app/join/{gym-slug}`
2. **Verify**: Enter full name and phone number
3. **Create Account**: Set up email and password
4. **Access Dashboard**: Redirected to main GainAi dashboard

## Supabase Setup Checklist

- [ ] Create `gyms` table with proper schema
- [ ] Create `gym_members` table with unique constraint on (gym_id, phone)
- [ ] Enable Row Level Security (RLS) if needed
- [ ] Ensure `auth.users` has proper user metadata fields
- [ ] Test signup and gym creation flow
- [ ] Verify gym member queries work correctly

## Environment Variables

The app uses standard Supabase environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These should be set in your `.env.local` file.

## Notes

- Gym slugs are auto-generated from gym names (lowercase, hyphens)
- Phone numbers are stored in E.164 format (+91xxxxxxxxxx)
- Member join_at timestamps are auto-generated on insert
- QR code generation is external via api.qrserver.com
- CSV bulk upload parses Name,Phone format
- All timestamps use UTC
