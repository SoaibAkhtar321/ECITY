import DashboardSavedSearch from "@/components/dashboard/saved-search";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "FCITY.ai — Dashboard Saved Search",
};
const index = () => {
   return (
      <Wrapper>
         <DashboardSavedSearch />
      </Wrapper>
   )
}

export default index