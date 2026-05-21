import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      duration={2800}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-ink group-[.toaster]:text-bg group-[.toaster]:border-transparent group-[.toaster]:shadow-3 group-[.toaster]:rounded-[var(--r-md)] group-[.toaster]:text-[13px] group-[.toaster]:px-4 group-[.toaster]:py-3",
          description: "group-[.toast]:text-muted-2",
          actionButton: "group-[.toast]:bg-accent group-[.toast]:text-accent-ink",
          cancelButton: "group-[.toast]:bg-surface-alt group-[.toast]:text-ink",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
