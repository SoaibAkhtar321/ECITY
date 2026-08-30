import PasswordChange from "@/components/dashboard/account-settings/password-change";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "FCITY.ai — Dashboard Account Password Change",
};
const index = () => {
   return (
      <Wrapper>
         <PasswordChange />
      </Wrapper>
   )
}

export default index