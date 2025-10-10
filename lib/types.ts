// Consistent types for both User and Admin frontends
export type Status = "Queued" | "Running" | "Success" | "Failed";

export interface User {
  id: string;
  username: string;
  nickname: string;
  signature: string;
  avatar_url: string;
}

export interface Contest {
  id: string;
  name: string;
  starttime: string;
  endtime: string;
  problem_ids: string[];
  description: string;
}

export interface WorkflowStep {
  name: string;
  image: string;
  root: boolean;
  timeout: number;
  show: boolean;
  steps: string[][];
  mounts: any[]; // Define more strictly if needed
  network: boolean;
}

export interface Problem {
    id: string;
    name: string;
    starttime: string;
    endtime: string;
    max_submissions: number;
    cluster: string;
    cpu: number;
    memory: number;
    upload: {
        max_num: number;
        max_size: number;
    };
    workflow: WorkflowStep[];
    score: {
        mode: string;
        max_performance_score: number;
    };
    description: string;
}


export interface Container {
  id: string;
  submission_id: string;
  user_id: string;
  image: string;
  status: Status;
  exit_code: number;
  started_at: string;
  finished_at: string;
  log_file_path: string;
}

export interface Submission {
  id: string;
  CreatedAt: string;
  UpdatedAt: string;
  problem_id: string;
  user_id: string;
  user: User;
  status: Status;
  current_step: number;
  cluster: string;
  node: string;
  allocated_cores: string;
  score: number;
  performance: number;
  info: { [key: string]: any };
  is_valid: boolean;
  containers: Container[];
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  nickname: string;
  avatar_url: string;
  total_score: number;
  problem_scores: Record<string, number>;
}

export interface ScoreHistoryPoint {
  time: string;
  score: number;
  problem_id: string;
}

export interface TrendEntry {
  user_id: string;
  username: string;
  nickname: string;
  history: ScoreHistoryPoint[];
}

export interface UserBestScore {
  ID: number;
  UserID: string;
  ContestID: string;
  ProblemID: string;
  Score: number;
  Performance: number;
  SubmissionID: string;
  SubmissionCount: number;
  LastScoreTime: string;
}

// Admin-specific types
export interface NodeState {
    name: string;
    cpu: number;
    memory: number;
    docker: string;
    used_memory: number;
    is_paused: boolean;
}

export interface ClusterState {
    name: string;
    node: NodeState[];
    nodes: Record<string, NodeState>; // The API returns `nodes`
}

export interface ClusterStatusResponse {
    resource_status: Record<string, ClusterState>;
    queue_lengths: Record<string, number>;
}

export interface NodeDetail extends NodeState {
    used_cores: boolean[];
}