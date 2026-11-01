const people = [
  { id: "maya", name: "Maya Sharma", color: "#7865d8" },
  { id: "arjun", name: "Arjun Mehta", color: "#ed9e64" },
  { id: "sana", name: "Sana Khan", color: "#5eaaa0" },
  { id: "rohan", name: "Rohan Iyer", color: "#dc7794" },
  { id: "neha", name: "Neha Patel", color: "#638dc8" },
];

export const initialData = {
  version: 1,
  currentUserId: "maya",
  groups: [
    { id: "college", name: "College Friends", category: "Friends", description: "Everyday plans with the gang.", members: people.slice(0, 4) },
    { id: "flatmates", name: "Flatmates", category: "Home", description: "Household bills and shared groceries.", members: [people[0], people[1], people[4]] },
    { id: "goa", name: "Goa Trip", category: "Travel", description: "Sun, sand, and shared memories.", members: people.slice(0, 5) },
  ],
  expenses: [
    { id: "e1", title: "Dinner at Saffron", amount: 425000, category: "Food & drink", groupId: "college", payerId: "arjun", shares: [{ memberId: "maya", amount: 106250 }, { memberId: "arjun", amount: 106250 }, { memberId: "sana", amount: 106250 }, { memberId: "rohan", amount: 106250 }], splitMethod: "equal", date: "2026-10-28", description: "Friday catch-up" },
    { id: "e2", title: "Monthly groceries", amount: 268500, category: "Groceries", groupId: "flatmates", payerId: "maya", shares: [{ memberId: "maya", amount: 89500 }, { memberId: "arjun", amount: 89500 }, { memberId: "neha", amount: 89500 }], splitMethod: "equal", date: "2026-10-25", description: "" },
    { id: "e3", title: "Villa booking", amount: 1250000, category: "Accommodation", groupId: "goa", payerId: "sana", shares: [{ memberId: "maya", amount: 250000 }, { memberId: "arjun", amount: 250000 }, { memberId: "sana", amount: 250000 }, { memberId: "rohan", amount: 250000 }, { memberId: "neha", amount: 250000 }], splitMethod: "equal", date: "2026-10-22", description: "Three nights, north Goa" },
    { id: "e4", title: "Electricity bill", amount: 184000, category: "Utilities", groupId: "flatmates", payerId: "neha", shares: [{ memberId: "maya", amount: 61334 }, { memberId: "arjun", amount: 61333 }, { memberId: "neha", amount: 61333 }], splitMethod: "equal", date: "2026-10-18", description: "" },
    { id: "e5", title: "Airport cabs", amount: 245000, category: "Transport", groupId: "goa", payerId: "maya", shares: [{ memberId: "maya", amount: 49000 }, { memberId: "arjun", amount: 49000 }, { memberId: "sana", amount: 49000 }, { memberId: "rohan", amount: 49000 }, { memberId: "neha", amount: 49000 }], splitMethod: "equal", date: "2026-10-16", description: "" },
    { id: "e6", title: "Movie night", amount: 150000, category: "Entertainment", groupId: "college", payerId: "sana", shares: [{ memberId: "maya", amount: 50000 }, { memberId: "sana", amount: 50000 }, { memberId: "rohan", amount: 50000 }], splitMethod: "equal", date: "2026-10-12", description: "" },
  ],
  settlements: [
    { id: "s1", groupId: "college", fromId: "maya", toId: "arjun", amount: 85000, date: "2026-10-20", method: "UPI (tracked)", status: "completed" },
    { id: "s2", groupId: "flatmates", fromId: "arjun", toId: "maya", amount: 42000, date: "2026-10-15", method: "Cash (tracked)", status: "completed" },
  ],
  preferences: { currency: "INR", theme: "light", notifications: true },
};
