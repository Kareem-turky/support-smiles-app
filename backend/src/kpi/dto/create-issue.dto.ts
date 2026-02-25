export class CreateIssueDto {
    employeeId: string;
    type: string;
    description: string;
    date: string;
    severity: string;
    deductionPoints: number;
}
