import Container from "@/components/shared/container";
import { getPricingConfig } from "@/lib/settings";
import CartAddItem from "./cart-add-item";

export default async function CartAddItemPage(props: { params: Promise<{ itemId: string }> }) {
  const [{ itemId }, pricing] = await Promise.all([props.params, getPricingConfig()]);
  return (
    <Container className="flex flex-col pb-16 pt-6 md:pb-20 md:pt-10">
      <CartAddItem itemId={itemId} pricing={pricing} />
    </Container>
  );
}
