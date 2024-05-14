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
  Divider,
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
  const [nameErr, setNameErr] = useState("");
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
      if(name.length===0){setNameErr("Name cannot be empty!")}
      else{
        setNameErr("");
        setIsGeneratingBundle(true);
        await adminApi.generateBundle(data.selected[0].id, data.selected[1].id, name);
      }
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
            onClick={() => {
              if(name.length===0) setNameErr("*Name cannot be empty!");
              else {setNameErr("");generateBundle()}
            }}
          >
            Create Bundle
          </Button>
      }
      secondaryAction={
        <Button   
          onPress={()=>{close()}}   
        >
          Close
        </Button>
      }
      loading={selectedProductsData === null}
    >
      <BlockStack gap="large">
        <BlockStack gap="base" inlineAlignment="center">
          <Heading>Bundling Products</Heading>
          <InlineStack blockAlignment="baseline">
            {selectedProductsData?.map((product, index) => {
              return (
                <BlockStack key={index} gap={"small"} inlineAlignment="center">
                  <Box inlineSize={100}  >
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText}
                    />
                    <Divider/>
                  </Box>
                  <Text fontWeight="bold-300">{product.title}</Text>
                </BlockStack>
              );
            })}
          </InlineStack>
        </BlockStack>
        <Box inlineSize={15} blockSize={15}></Box>
        <TextField label="Bundle name" onFocus={()=>{
          setNameErr("")
        }} value={name} onChange={setName} />
        <Text fontStyle="italic">{nameErr}</Text>
      </BlockStack>
    </AdminAction>
  );
}
