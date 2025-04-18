
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConversionConfig as ConfigType } from "@/lib/types";

interface ConversionConfigProps {
  onChange: (config: ConfigType) => void;
  defaultConfig?: ConfigType;
}

const ConversionConfig = ({
  onChange,
  defaultConfig = { conversionLevel: "standard" }
}: ConversionConfigProps) => {
  const [config, setConfig] = useState<ConfigType>(defaultConfig);
  const [activeTab, setActiveTab] = useState<string>("basic");

  const updateConfig = (updates: Partial<ConfigType>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange(newConfig);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konverziós beállítások</CardTitle>
        <CardDescription>
          A JSX-TSX konverzió testreszabása a projekt igényei szerint
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="basic">Alap</TabsTrigger>
            <TabsTrigger value="advanced">Haladó</TabsTrigger>
            <TabsTrigger value="naming">Elnevezések</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="conversionLevel">Konverziós szint</Label>
                <Select
                  value={config.conversionLevel}
                  onValueChange={(value) => 
                    updateConfig({ conversionLevel: value as ConfigType["conversionLevel"] })
                  }
                >
                  <SelectTrigger id="conversionLevel">
                    <SelectValue placeholder="Válassz szintet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      Alapszintű - Egyszerű típuskonverzió
                    </SelectItem>
                    <SelectItem value="standard">
                      Standard - Teljes komponens típusok
                    </SelectItem>
                    <SelectItem value="advanced">
                      Haladó - Hook optimalizáció és részletes típusok
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="preserveFormatting"
                  checked={config.preserveFormatting || false}
                  onCheckedChange={(checked) =>
                    updateConfig({ preserveFormatting: checked })
                  }
                />
                <Label htmlFor="preserveFormatting">
                  Formázás megőrzése
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="includeJSDoc"
                checked={config.includeJSDoc || false}
                onCheckedChange={(checked) =>
                  updateConfig({ includeJSDoc: checked })
                }
              />
              <Label htmlFor="includeJSDoc">JSDoc kommentek megőrzése</Label>
            </div>
          </TabsContent>

          <TabsContent value="naming" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="customNaming"
                checked={config.customInterfaceNaming || false}
                onCheckedChange={(checked) =>
                  updateConfig({ customInterfaceNaming: checked })
                }
              />
              <Label htmlFor="customNaming">
                Egyedi interfész elnevezési konvenciók
              </Label>
            </div>

            {config.customInterfaceNaming && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <Label htmlFor="prefix">Interfész előtag</Label>
                  <Input
                    id="prefix"
                    value={config.interfacePrefix || ""}
                    onChange={(e) =>
                      updateConfig({ interfacePrefix: e.target.value })
                    }
                    placeholder="I"
                  />
                </div>
                <div>
                  <Label htmlFor="suffix">Interfész utótag</Label>
                  <Input
                    id="suffix"
                    value={config.interfaceSuffix || "Props"}
                    onChange={(e) =>
                      updateConfig({ interfaceSuffix: e.target.value })
                    }
                    placeholder="Props"
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ConversionConfig;
