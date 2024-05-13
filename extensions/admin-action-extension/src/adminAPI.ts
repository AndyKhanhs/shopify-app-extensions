import { GraphQLError } from "@shopify/ui-extensions/build/ts/surfaces/admin/api/standard/standard";

type ApiVersion =
  | "2023-04"
  | "2023-07"
  | "2023-10"
  | "2024-01"
  | "2024-04"
  | "unstable";
type Query = <Data = unknown, Variables = { [key: string]: unknown }>(
  query: string,
  options?: {
    variables?: Variables;
    version?: Omit<ApiVersion, "2023-04">;
  }
) => Promise<{ data?: Data; errors?: GraphQLError[] }>;

type ProductVariants = {
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        price: string;
      };
    }[];
  };
};

type MergedVariantsInput = {
  parentProductId: string;
  productVariantRelationshipsToCreate: {
    id: string;
    quantity: number;
  }[];
}[];

export class AdminAPI {
  query: Query;
  constructor(query: Query) {
    this.query = query;
  }
  private async getProductVariants(productId: string) {
    const result = await this.query<{ product: ProductVariants }>(`
        query{
            product(id:"${productId}"){
                variants(first:1){
                    edges{
                        node {
                            id 
                            title 
                            price
                        }
                    }
                }
            }
        }`);
    if (result.data) {
      return result.data.product;
    } else {
      throw new Error(result.errors?.[0].message);
    }
  }
  private async createBundleProduct(
    product1Variants: ProductVariants,
    product2Variants: ProductVariants,
    name: string
  ) {
    const result = await this.query<{
      productCreate: {
        product: {
          id: string;
          variants: {
            edges: {
              node: {
                id: string;
              };
            }[];
          };
        };
      };
    }>(
      `
      mutation ProductCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
      `,
      {
        variables: {
          input: {
            title: name,
            // variants: {
            //   price:
            //     parseFloat(product1Variants.variants.edges[0].node.price) +
            //     parseFloat(product2Variants.variants.edges[0].node.price),
            // },
          },
        },
      }
    );
    console.log(result);
    if (result.data) {
      console.log(3);
      const mergedVariantsInput: MergedVariantsInput = [
        {
          parentProductId: result.data.productCreate.product.id,
          productVariantRelationshipsToCreate: [
            {
              id: product1Variants.variants.edges[0].node.id,
              quantity: 1,
            },
            {
              id: product2Variants.variants.edges[0].node.id,
              quantity: 1,
            },
          ],
        },
      ];

      return mergedVariantsInput;
    } else {
      throw new Error(result.errors?.[0].message);
    }
  }
  private async linkBundledProducts(mergedVariants: MergedVariantsInput) {
    const result = await this.query<{
      productVariantRelationshipBulkUpdate: {
        parentProductVariants: {
          id: string;
          requiresComponents: boolean;
          product: {
            id: string;
          };
        };
      };
    }>(
      `
            mutation VariantRelationship($input:[ProductVariantRelationshipUpdateInput!]!){
                productVariantRelationshipBulkUpdate(input:$input){
                    parentProductVariants{
                        id
                        requiresComponents
                        product{
                            id
                        }
                    }
                }
            }
        `,
      {
        variables: {
          input: mergedVariants,
        },
      }
    );
    if (result.data) {
      return result.data;
    } else {
      throw new Error(result.errors?.[0].message);
    }
  }
  async generateBundle(
    product1Id: string,
    product2Id: string,
    bundleName: string
  ) {
    const product1Variants = await this.getProductVariants(product1Id);
    const product2Variants = await this.getProductVariants(product2Id);
    const generatedVariants = await this.createBundleProduct(
      product1Variants,
      product2Variants,
      bundleName
    );
    console.log(generatedVariants);
    const linkOperationResponse =
      await this.linkBundledProducts(generatedVariants);
    return linkOperationResponse;
  }
  async generateProducts(productIds: string[]) {
    const ids = productIds
      .map((id) => `id:${id.split("/").at(-1)}`)
      .join(" OR ");
    const result = await this.query<{
      products: {
        edges: {
          node: {
            title: string;
            featuredImage: {
              url: string;
              altText: string;
            };
          };
        }[];
      };
    }>(`
    query{
      products(first:10,query:"${ids}"){
        edges{
          node{
            title
            featuredImage{
              url
              altText
            }
          }
        }
      }
    }
    `);
    if (result.data) {
      const eee = result.data.products.edges.map(({ node }) => node);
      console.log(eee);
      return eee;
    } else {
      throw new Error(result.errors?.[0].message);
    }
  }
  async getBundledProducts(productIds: string) {
    const result = await this.query<{
      product: {
        variants: {
          edges: {
            node: {
              requiresComponents: boolean;
              productVariantComponents: {
                edges: {
                  node: {
                    productVariant: {
                      product: {
                        title: string;
                        featuredImage: {
                          url: string;
                          altText: string;
                        };
                      };
                    };
                  };
                }[];
              };
            };
          }[];
        };
      };
    }>(
      `
      query{
        product(id:"${productIds}"){
          variants(first:1){
            edges{
              node{
                requiresComponents
                productVariantComponents(first:2){
                  edges{
                    node{
                      productVariant{
                        product{
                          title
                          featuredImage{
                            url
                            altText
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      `
    );
    console.log(result);
    if (result.data) {
      const isBundled =
        result.data.product.variants.edges[0].node.requiresComponents;
      if (isBundled) {
        const bundledProducts = result.data.product.variants.edges.map(
          ({ node }) => {
            const product1 =
              node.productVariantComponents.edges[0].node.productVariant
                .product;
            const product2 =
              node.productVariantComponents.edges[1].node.productVariant
                .product;
            return [product1, product2];
          }
        );
        return bundledProducts[0];
      } else {
        return null;
      }
    } else {
      throw new Error(result.errors?.[0].message);
    }
  }
}
