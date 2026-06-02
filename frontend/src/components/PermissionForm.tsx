import { useState } from "react";
import type { Permission } from "@/api/generated/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PERMISSION_UI_DEFS } from "@/lib/permissions.ts";

const permissionEntries = Object.entries(PERMISSION_UI_DEFS) as [
  keyof typeof PERMISSION_UI_DEFS,
  (typeof PERMISSION_UI_DEFS)[keyof typeof PERMISSION_UI_DEFS],
][];

type ApplicableTypes = string | number | boolean;

type FormState = {
  [K in keyof typeof PERMISSION_UI_DEFS]: {
    enabled: boolean;
    props: {
      [P in keyof (typeof PERMISSION_UI_DEFS)[K]["props"]]: ApplicableTypes;
    };
  };
};

export default function PermissionManager() {
  const [formState, setFormState] = useState<FormState>(() => {
    type TempFormState = {
      [K in keyof typeof PERMISSION_UI_DEFS]: {
        enabled: boolean;
        props: Record<string, ApplicableTypes>;
      };
    };

    const initialState = {} as TempFormState;

    permissionEntries.forEach(([type, def]) => {
      const defaultProps: Record<string, ApplicableTypes> = {};

      Object.entries(def.props).forEach(([propKey, propMeta]) => {
        if (propMeta.type === "boolean") defaultProps[propKey] = false;
        // @ts-expect-error for future use
        if (propMeta.type === "string") defaultProps[propKey] = "";
        // @ts-expect-error for future use
        if (propMeta.type === "number") defaultProps[propKey] = 0;
      });

      initialState[type] = { enabled: false, props: defaultProps };
    });

    return initialState as unknown as FormState;
  });

  const handleTogglePermission = (
    type: keyof typeof PERMISSION_UI_DEFS,
    checked: boolean,
  ) => {
    setFormState((prev) => ({
      ...prev,
      [type]: { ...prev[type], enabled: checked },
    }));
  };

  const handlePropChange = (
    type: keyof typeof PERMISSION_UI_DEFS,
    propKey: string,
    value: ApplicableTypes,
  ) => {
    setFormState((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        props: {
          ...prev[type].props,
          [propKey]: value,
        },
      },
    }));
  };

  const handleSubmit = () => {
    const payload: Permission[] = permissionEntries
      .filter(([type]) => formState[type].enabled)
      .map(([type]) => ({
        type,
        ...formState[type].props,
      })) as Permission[];

    console.log("Payload: ", JSON.stringify(payload, null, 2));
    // 本来はここでAPIリクエストを送信する
  };

  return (
    <div className="max-w-2xl mx-auto p-1 py-4 space-y-6">
      <div className="space-y-4">
        {permissionEntries.map(([type, def]) => {
          const isEnabled = formState[type].enabled;
          const hasProps = Object.keys(def.props).length > 0;

          return (
            <Card
              key={type}
              className={`transition-colors ${isEnabled ? "border-primary/50" : ""}`}
            >
              <CardContent className="py-1 px-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">
                      {def.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {def.description}
                    </p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      handleTogglePermission(type, checked)
                    }
                  />
                </div>

                {isEnabled && hasProps && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      オプション:
                    </p>

                    {Object.entries(def.props).map(([propKey, propMeta]) => {
                      const currentProps = formState[type].props as Record<
                        string,
                        ApplicableTypes
                      >;

                      return (
                        <div
                          key={propKey}
                          className="flex items-center justify-between pl-4"
                        >
                          <Label
                            htmlFor={`${type}-${propKey}`}
                            className="text-sm"
                            id={`${type}-${propKey}-label`}
                          >
                            - {propMeta.label}
                          </Label>

                          <div className="w-1/2 flex justify-end">
                            {propMeta.type === "boolean" && (
                              <Switch
                                id={`${type}-${propKey}`}
                                checked={currentProps[propKey] as boolean}
                                onCheckedChange={(checked) =>
                                  handlePropChange(type, propKey, checked)
                                }
                              />
                            )}

                            {/* @ts-expect-error for future use */}
                            {propMeta.type === "string" && (
                              <Input
                                aria-labelledby={`${type}-${propKey}-label`}
                                id={`${type}-${propKey}`}
                                value={currentProps[propKey] as string}
                                onChange={(e) =>
                                  handlePropChange(
                                    type,
                                    propKey,
                                    e.target.value,
                                  )
                                }
                                placeholder="入力してください"
                                className="h-8 text-sm"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} className="w-full sm:w-auto">
          権限を保存する
        </Button>
      </div>
    </div>
  );
}
