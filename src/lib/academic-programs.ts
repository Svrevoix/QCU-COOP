export const departmentCourses = {
	'College of Computer Studies': [
		'Information Systems',
		'Information Technology',
		'Computer Science'
	],
	'College of Education': ['Early Childhood Education'],
	'College of Business Administration and Accountancy': ['Accountancy', 'Entrepreneurship'],
	'College of Engineering': [
		'Industrial Engineering',
		'Electronics Engineering',
		'Computer Engineering'
	]
} as const;

export type Department = keyof typeof departmentCourses;

export function isDepartment(value: string): value is Department {
	return Object.hasOwn(departmentCourses, value);
}

export function isCourseForDepartment(department: string, course: string): boolean {
	return isDepartment(department) && departmentCourses[department].some((item) => item === course);
}

export function maxYearLevelForCourse(course: string): 3 | 4 {
	return course === 'Entrepreneurship' ? 3 : 4;
}
