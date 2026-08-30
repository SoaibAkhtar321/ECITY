import DashboardIndex from "@/components/dashboard/index";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "FCITY.ai — Dashboard Index",
};
const index = () => {
   return (
      <Wrapper>
         <DashboardIndex />
      </Wrapper>
   )
}

export default index