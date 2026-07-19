import { Camera, SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useCategoriesOperation } from "@/hooks/management/categories/use-categories-operation";
import { Button } from "../ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";

interface PosFiltersComponent {
  setCameraOpen: (open: boolean) => void;
  onSearchChange: (search: string) => void;
  onChangeCategory: (category: string) => void;
}

export default function PosFiltersComponent({
  setCameraOpen,
  onSearchChange,
  onChangeCategory,
}: PosFiltersComponent) {
  const { getCategoriesListData } = useCategoriesOperation({
    enableGetCategoriesList: true,
  });
  const [inputSearch, setInputSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const debouncedSearch = useDebounce(inputSearch, 500);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    onChangeCategory(categoryId);
  }, [categoryId]);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 md:items-center">
        <InputGroup className="bg-card">
          <InputGroupInput
            id="inline-start-input"
            value={inputSearch}
            onChange={(e) => setInputSearch(e.target.value)}
            placeholder="Search..."
          />
          <InputGroupAddon align="inline-start">
            <SearchIcon className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
        <Button size={"sm"} type="button" onClick={() => setCameraOpen(true)}>
          <Camera />
          Scan Barcode
        </Button>
      </div>
      <Tabs defaultValue="semua">
        <TabsList className="bg-card rounded-md w-full overflow-hidden overflow-x-auto no-scrollbar flex flex-row justify-start gap-1 p-1 group-data-horizontal/tabs:h-auto min-h-12">
          <TabsTrigger
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-secondary/20 flex-none"
            value="semua"
            onClick={() => setCategoryId("")}
          >
            Semua
          </TabsTrigger>
          {getCategoriesListData?.data.map((item) => (
            <TabsTrigger
              key={item.id}
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary hover:bg-secondary/20 flex-none"
              value={item.id}
              onClick={() => {
                setCategoryId(item.id);
              }}
            >
              {item.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  );
}
