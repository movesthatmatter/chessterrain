import { noop } from '../util-kit';
import React, {
  useMemo,
  useState,
  MouseEvent,
  useRef,
  useCallback,
} from 'react';

type Props = Omit<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd'
> & {
  onDragStart?: (e: MouseEvent) => void;
  onDrag?: (e: MouseEvent) => void;
  onDragEnd?: (e: MouseEvent) => void;
};

export const InteractionLayer: React.FC<Props> = ({
  onDrag = noop,
  onDragStart = noop,
  onDragEnd = noop,
  onMouseDown = noop,
  onMouseUp = noop,
  onClick = noop,
  onMouseMove = noop,
  ...props
}) => {
  // Drag Interaction via onMouseDown/Up/Move Handlers
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  const onMouseMoveWhilistDownHandler = useMemo(() => {
    return isDragActive
      ? (e: MouseEvent<any>) => {
          onDrag(e);
          onMouseMove(e);
        }
      : onMouseMove;
  }, [isDragActive, onDrag, onMouseMove]);

  const mouseDownRef = useRef<boolean>();

  const onMouseUpHandler = useMemo(
    () => (e: MouseEvent<any>) => {
      mouseDownRef.current = false;

      if (isDragActive) {
        onDragEnd(e);
        setIsDragActive(false);
      }

      onMouseUp(e);
    },
    [onDragEnd, onMouseUp, isDragActive]
  );

  const onMouseDownHandler = useMemo(
    () => (e: MouseEvent<any>) => {
      mouseDownRef.current = true;

      setTimeout(() => {
        // If it's still true it means drag
        if (mouseDownRef.current === true) {
          setIsDragActive(true);
          onDragStart(e);
        } else {
          // Otherwise means click
          onClick(e);
        }
      }, 100); // 100 ms is a good enough time to differentiate between click and drag
    },
    [onDragStart, onMouseDown, setIsDragActive, onClick]
  );

  const onContextHandler = useCallback((event: MouseEvent<any>) => {
    // Remove Right Click Ability
    event.preventDefault();
  }, []);

  return (
    <div
      onMouseDown={onMouseDownHandler}
      onMouseUp={onMouseUpHandler}
      onMouseMove={onMouseMoveWhilistDownHandler}
      onContextMenu={onContextHandler}
      {...props}
    />
  );
};
