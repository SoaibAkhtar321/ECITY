import DashboardMessage from "@/components/dashboard/message";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "FCITY.ai — Dashboard Message",
};
const index = () => {
   return (
      <Wrapper>
         <DashboardMessage />
      </Wrapper>
   )
}

export default index