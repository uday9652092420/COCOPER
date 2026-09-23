export interface MobileBootstrapBranch {
  id: string;
  branch_code: string | null;
  branch_name: string;
  status: string;
  is_default: boolean;
}

export interface MobileBootstrapResponse {
  success: true;
  user: {
    id: string;
    username: string;
    full_name: string | null;
    email: string | null;
    role: string;
  };
  organization: {
    id: string;
    organization_name: string;
  };
  branches: MobileBootstrapBranch[];
  default_branch_id: string | null;
}