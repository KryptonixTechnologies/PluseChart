import { createContext } from "react";
import type { AuthSession } from "../services/authSession";

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  invite_code: string;
  company_id?: string;
}

export interface CompanyRegistrationInput {
  company_name: string;
  domain: string;
  industry: string;
  country: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
  admin_job_title: string;
}

export interface AuthContextValue {
  session: AuthSession | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegistrationInput) => Promise<void>;
  registerCompany: (input: CompanyRegistrationInput) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
