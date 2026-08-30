import DashboardProfile from "@/components/dashboard/profile";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "FCITY.ai — Dashboard Profile",
};
const index = () => {
   return (
      <Wrapper>
         <DashboardProfile />
      </Wrapper>
   )
}

export default index