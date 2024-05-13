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
import { AdminAPI } from "./adminAPI";

// The target used here must match the target used in the extension's toml file (./shopify.extension.toml)
const TARGET = "admin.product-index.selection-action.render";

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
  const adminApi = useMemo(() => new AdminAPI(query), []);
  console.log({ data });
  const [productTitle, setProductTitle] = useState("");
  const [name, setName] = useState("");
  const [isGeneratingBundle, setIsGeneratingBundle] = useState(false);
  const [selectedProductsData, setSelectedProductsData] = useState<
    | {
        title: string;
        featuredImage: {
          url: string;
          altText: string;
        };
      }[]
    | null
  >(null);

  useEffect(() => {
    async function generateProducts() {
      const result = await adminApi.generateProducts([
        data.selected[0].id,
        data.selected[1].id,
      ]);
      console.log(result);
      setSelectedProductsData(result);
    }
    if (data.selected.length === 2) {
      console.log(123);
      generateProducts();
    }
  }, []);

  async function generateBundle() {
    try {
      setIsGeneratingBundle(true);
      adminApi.generateBundle(data.selected[0].id, data.selected[1].id, name);
    } catch (e) {
      console.log(e);
    } finally {
      setIsGeneratingBundle(false);
      close();
    }
  }
  if (data.selected.length !== 2) {
    return (
      <AdminAction>
        <Text>Only 2 products are supported for bundling</Text>
      </AdminAction>
    );
  }
  return (
    // The AdminAction component provides an API for setting the title and actions of the Action extension wrapper.
    <AdminAction
      primaryAction={
        <Button
          onPress={() => {
            console.log("saving");
            close();
          }}
        >
          Done
        </Button>
      }
      secondaryAction={
        <Button
          onPress={() => {
            console.log("closing");
            close();
          }}
        >
          Close
        </Button>
      }
      loading={selectedProductsData === null}
    >
      <BlockStack gap="large">
        <BlockStack gap="base" inlineAlignment="center">
          <Heading>Bundling Products</Heading>
          <InlineStack>
            {selectedProductsData?.map((product, index) => {
              return (
                <BlockStack key={index} gap={"small"} inlineAlignment="center">
                  <Box inlineSize={80} blockSize={80}>
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText}
                    />
                  </Box>
                  <Text fontWeight="bold-300">{product.title}</Text>
                </BlockStack>
              );
            })}
          </InlineStack>
        </BlockStack>
        <Box inlineSize={15} blockSize={15}></Box>
        <TextField label="Bundle name" value={name} onChange={setName} />
        <Button
          disabled={name.length === 0 || isGeneratingBundle}
          onClick={generateBundle}
          variant="primary"
        >
          Create bundle
        </Button>
      </BlockStack>
    </AdminAction>
  );
}
