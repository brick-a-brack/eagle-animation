export const ANIMATOR_CHANGE_PARAMETER = 'ANIMATOR_CHANGE_PARAMETER';

export const animatorChangeParameter = (name, value) => ({ type: ANIMATOR_CHANGE_PARAMETER, data: { name, value } });