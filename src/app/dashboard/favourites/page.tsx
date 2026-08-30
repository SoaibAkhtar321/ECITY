import DashboardFavourite from "@/components/dashboard/favourites";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "FCITY.ai — Dashboard Favourite",
};
const index = () => {
   return (
      <Wrapper>
         <DashboardFavourite />
      </Wrapper>
   )
}

export default index