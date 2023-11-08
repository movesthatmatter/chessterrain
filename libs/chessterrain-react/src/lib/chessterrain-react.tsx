import styles from './chessterrain-react.module.css';

/* eslint-disable-next-line */
export interface ChessterrainReactProps {}

export function ChessterrainReact(props: ChessterrainReactProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to ChessterrainReact!</h1>
    </div>
  );
}

export default ChessterrainReact;
