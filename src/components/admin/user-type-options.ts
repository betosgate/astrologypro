export type UserTypeOption = {
  value: string;
  label: string;
};

export const ALL_USER_TYPES: UserTypeOption[] = [
  { value: "admin", label: "Admin" },
  { value: "diviner", label: "Diviner" },
  { value: "client", label: "Client" },
  { value: "advocate", label: "Social Advocate" },
  { value: "trainee", label: "Trainee" },
  { value: "community_mystery_school", label: "Community - Mystery School" },
  {
    value: "community_perennial_mandalism",
    label: "Community - Perennial Mandalism",
  },
];

export const ADMIN_ONLY_USER_TYPES: UserTypeOption[] = [
  ALL_USER_TYPES[0],
];
