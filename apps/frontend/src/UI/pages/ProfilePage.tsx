import { CompanyInformationCard, UserInformationCard, UserMetaCard } from "@/UI/components/profile";
import { ComponentCard } from "@/UI/components/interaction";

export function ProfilePage() {
  return (
    <div className="p-6">
      <ComponentCard title="Profile">
        <UserMetaCard />
        <UserInformationCard />
        <CompanyInformationCard />
      </ComponentCard>
    </div>
  );
}
