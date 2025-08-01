import { getUserAccounts } from "@/actions/dashboard";
import { AccountCard } from "./account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default async function DashboardContent() {
  console.log("Fetching accounts");
  
  try {
    const result = await getUserAccounts();
    
    if (!result.success) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">Something went wrong</p>
        </div>
      );
    }

    const accounts = result.data || [];

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>
        {accounts.length > 0 &&
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    );
  } catch (error) {
    console.error("Dashboard page error:", error);
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Something went wrong</p>
      </div>
    );
  }
}