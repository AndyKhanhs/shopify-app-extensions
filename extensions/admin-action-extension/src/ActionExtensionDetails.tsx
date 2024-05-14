import { useEffect, useMemo, useState } from "react";
import {
  reactExtension,
  useApi,
  AdminAction,
  BlockStack,
  Button,
  Text,
  TextField,
  Heading,
  Image,
  Box,
  InlineStack,
} from "@shopify/ui-extensions-react/admin";
const TARGET = "admin.product-details.action.render";
import { AdminAPI } from "./adminAPI";
export default reactExtension(TARGET, () => <App />);

function App() {
  // The useApi hook provides access to several useful APIs like i18n, close, and data.
  const {
    extension: { target },
    i18n,
    close,
    data,
    query,
  } = useApi(TARGET);
  const [bundledProducts, setBundledProducts] = useState<
    | {
        title: string;
        featuredImage: {
          url: string;
          altText: string;
        };
      }[]
    | null
  >([]);
  const adminAPI = useMemo(() => new AdminAPI(query), []);
  useEffect(() => {
    async function getBundledProducts() {
      const bundledProducts = await adminAPI.getBundledProducts(
        data.selected[0].id
      );
      setBundledProducts(bundledProducts);
    }
    getBundledProducts();
  }, []);
  //console.log(bundledProducts);
  return (
    <AdminAction loading={bundledProducts?.length === 0}>
      {bundledProducts === null ? (
        <Text>This is not bundle product!</Text>
      ) : (
        <BlockStack gap="base" inlineAlignment="center">
          <Heading>Bundled Products</Heading>

          {bundledProducts?.map((product, index) => {
            return (
              <InlineStack key={index} gap={"base"} blockAlignment="center">
                <Box inlineSize={100} >
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText}
                  />
                </Box>
                <Text fontWeight="bold-300">{product.title}</Text>
              </InlineStack>
            );
          })}
        </BlockStack>
      )}
      {/* <Text>Listing Bundle Components</Text> */}
    </AdminAction>
  );
}
