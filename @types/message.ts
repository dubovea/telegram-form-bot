export type AllBlocks = MainBlock[];
export type MainBlock = {
  key: string;
  title: string;
  answer: string;
  blocks: BlockText[];
};

export type BlockText = {
  key: string;
  text: string;
  type: string;
  errorMessage?: string;
  validation?: (text: string) => boolean;
};
