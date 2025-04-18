
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, fallback = "/placeholder.svg", alt, ...props }, ref) => {
    const [src, setSrc] = React.useState(props.src)
    const [error, setError] = React.useState(false)

    React.useEffect(() => {
      setSrc(props.src)
      setError(false)
    }, [props.src])

    return (
      <img
        {...props}
        ref={ref}
        src={error ? fallback : src}
        alt={alt}
        onError={() => setError(true)}
        className={cn(
          "aspect-square h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
      />
    )
  }
)
Image.displayName = "Image"

export { Image }
