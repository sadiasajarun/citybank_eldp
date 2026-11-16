import { useNavigate } from 'react-router-dom';
import { PERSONAS, ROLE_HOME } from '../data';
import { useDemo } from '../store';
import type { Role } from '../types';

const EMPLOYEES: Record<string, { name: string; title: string; eid: string; dept: string }> = {
  e1: { name: 'Ayesha Rahman', title: 'Relationship Manager', eid: 'CBL-10482', dept: 'Corporate Banking Division' },
  e2: { name: 'Tanvir Hasan', title: 'Credit Analyst', eid: 'CBL-09371', dept: 'Corporate Banking Division' },
  e4: { name: 'Sadia Islam', title: 'Senior Credit Analyst', eid: 'CBL-11804', dept: 'Risk Management Division' },
};

/** The persona behind a role; for employees, the selected employee (fictional demonstration data). */
export function personaFor(role: Role, employeeId: string) {
  const p = PERSONAS[role];
  return role === 'employee' && EMPLOYEES[employeeId] ? { ...p, ...EMPLOYEES[employeeId] } : p;
}

/** Switch perspective on the same record: sets role (and employee), navigates, explains the change. */
export function useSwitchRole() {
  const nav = useNavigate();
  return (r: Role, to?: string, emp?: string) => {
    const s = useDemo.getState();
    const roleChanged = r !== s.role;
    const empChanged = r === 'employee' && emp !== undefined && emp !== s.employeeId;
    s.setRole(r);
    if (emp) s.setEmployee(emp);
    nav(to ?? ROLE_HOME[r]);
    if (empChanged && !roleChanged) {
      useDemo.setState({ toast: `You are now viewing ${personaFor('employee', emp!).name}’s learning record.` });
    } else if (roleChanged) {
      const next = useDemo.getState();
      useDemo.setState({ toast: r === 'employee' ? `You are now viewing ${personaFor(r, next.employeeId).name}’s learning record.` : `You are now viewing this workflow as ${PERSONAS[r].label}.` });
    }
  };
}
