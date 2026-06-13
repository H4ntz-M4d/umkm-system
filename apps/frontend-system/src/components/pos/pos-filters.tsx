import { SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useCategoriesOperation } from "@/hooks/management/categories/use-categories-operation";

export default function PosFiltersComponent() {
  const { getCategoriesListData } = useCategoriesOperation({
    enableGetCategoriesList: true,
  });
  return (
    <>
      <InputGroup className="bg-card">
        <InputGroupInput id="inline-start-input" placeholder="Search..." />
        <InputGroupAddon align="inline-start">
          <SearchIcon className="text-muted-foreground" />
        </InputGroupAddon>
      </InputGroup>
      <Tabs defaultValue="semua">
        <TabsList className="bg-card rounded-md w-full justify-start h-auto lg:h-10 gap-1 p-1">
          <TabsTrigger
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-secondary/20 flex-none"
            value="semua"
          >
            Semua
          </TabsTrigger>
          {getCategoriesListData?.data.map((item) => (
            <TabsTrigger
              key={item.id}
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-secondary/20 flex-none"
              value={item.id}
            >
              {item.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  );
}
