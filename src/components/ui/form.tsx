"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Controller,
  FormProvider,
  useController,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Form = FormProvider;

type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = {
  name: TName;
};

const FormFieldContext = createContext<FormFieldContextValue>({ name: "" });

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

function FormItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error } = useFormField();
  return <Label className={cn(error && "text-destructive", className)} {...props} />;
}

function FormControl({ children }: { children: ReactNode }) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  if (!isValidElement(children)) return children;

  return cloneElement(children as ReactElement<Record<string, unknown>>, {
    id: formItemId,
    "aria-describedby": error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId,
    "aria-invalid": !!error,
  });
}

function FormMessage({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const { error, formMessageId } = useFormField();
  const body = error?.message?.toString();
  if (!body) return null;
  return <p id={formMessageId} className={cn("text-sm font-medium text-destructive", className)} {...props}>{body}</p>;
}

function useFormField() {
  const fieldContext = useFormContext();
  const itemContext = useFormFieldContext();
  const field = useController({ name: itemContext.name, control: fieldContext.control });
  const formItemId = `form-item-${itemContext.name}`;
  return {
    name: itemContext.name,
    error: field.fieldState.error,
    formItemId,
    formDescriptionId: `${formItemId}-description`,
    formMessageId: `${formItemId}-message`,
  };
}

function useFormFieldContext() {
  const context = useContext(FormFieldContext);
  if (!context) throw new Error("Form components must be used inside FormField");
  return context;
}

export { Form, FormControl, FormField, FormItem, FormLabel, FormMessage };