export interface Cmd {
  id: number,
  name: string,
  executable: string,
  workdir: string,
  isRunning: boolean,
}
