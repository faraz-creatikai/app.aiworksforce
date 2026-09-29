"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { EmployeeAuthProvider } from "@/context/EmployeeAuthContext"; // <-- Import this
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/theme/muiTheme";
import { CustomerImportProvider } from "@/context/CustomerImportContext";
import { ContactImportProvider } from "@/context/ContactImportContext";
import { CustomerFieldLabelProvider } from "@/context/customer/CustomerFieldLabelContext";
import { ThemeProviderCustom } from "@/context/ThemeContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { ProjectUpdatesProvider } from "@/context/customer/ProjectUpdatesContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {/* Wrap everything in the Employee context as well */}
      <EmployeeAuthProvider> 
        <CustomerAuthProvider>
           <ProjectUpdatesProvider>  
        <ThemeProviderCustom>
          <CustomerImportProvider>
            <ContactImportProvider>
              <CustomerFieldLabelProvider>
                <ThemeProvider theme={theme}>{children}</ThemeProvider>
              </CustomerFieldLabelProvider>
            </ContactImportProvider>
          </CustomerImportProvider>
        </ThemeProviderCustom>
         </ProjectUpdatesProvider>  
        </CustomerAuthProvider>
      </EmployeeAuthProvider>
    </AuthProvider>
  );
}