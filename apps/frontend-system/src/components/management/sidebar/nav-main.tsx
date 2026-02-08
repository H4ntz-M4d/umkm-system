"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

function NavGroup({label, items, pathName}: {
  label: string,
  items: NavItem[],
  pathName: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;
          const isSubActive = item.items?.some((sub) => pathName === sub.url)
          const isParentActive = pathName === item.url
          

          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title} className="flex flex-col justify-center group-data-[collapsible=icon]:items-center">
                <SidebarMenuButton asChild isActive={isParentActive} tooltip={item.title}>
                  <Link href={item.url}>
                    {item.icon && <item.icon className="text-olive-600" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isSubActive || item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem className="flex flex-col justify-center group-data-[collapsible=icon]:items-center">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={isSubActive} tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={pathName === subItem.url}>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        }

        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function NavMain({
  masterItems, reportAndFinanceItems, inventoryAndProductionItems, pathname
}: {
  masterItems: NavItem[],
  reportAndFinanceItems: NavItem[],
  inventoryAndProductionItems: NavItem[],
  pathname: string
}) {
  return (
    <>
      <NavGroup label="Master Data" items={masterItems} pathName={pathname} />
      <NavGroup label="Inventaris" items={inventoryAndProductionItems} pathName={pathname} />
      <NavGroup label="Report & Finance" items={reportAndFinanceItems} pathName={pathname} />
    </>
  )
}
