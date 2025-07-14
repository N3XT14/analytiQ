"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FilterDrawer({ open, onOpenChange }: FilterDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter Options</DrawerTitle>
          <DrawerDescription>Customize your dashboard view</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date-range">Date Range</Label>
              <div className="flex items-center gap-2">
                <DatePicker />
                <span>to</span>
                <DatePicker />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Data Sources</Label>
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="source-1" defaultChecked />
                  <label
                    htmlFor="source-1"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Source 1
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="source-2" defaultChecked />
                  <label
                    htmlFor="source-2"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Source 2
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="source-3" />
                  <label
                    htmlFor="source-3"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Source 3
                  </label>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="comparison-type">Comparison Type</Label>
              <RadioGroup defaultValue="absolute">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="absolute" id="absolute" />
                  <Label htmlFor="absolute">Absolute Values</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage">Percentage Change</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">Both</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="granularity">Data Granularity</Label>
              <Select defaultValue="daily">
                <SelectTrigger>
                  <SelectValue placeholder="Select granularity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <Button>Apply Filters</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
