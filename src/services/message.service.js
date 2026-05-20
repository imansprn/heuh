// ─────────────────────────────────────────────────────────────────────────────
//  message.service.js
//  Header (columns) = left repo name + right badge
//  injectDiffText = diff preview without cloud storage (decoratedText)
// ─────────────────────────────────────────────────────────────────────────────

const GITHUB_FAVICON = 'https://github.githubassets.com/favicon.ico';
const SENTRY_FAVICON = 'https://sentry.io/favicon.ico';

// ── Colour maps ───────────────────────────────────────────────────────────────
const GITHUB_META = {
    opened: { label: 'OPEN', hex: '#1a7f37' },
    merged: { label: 'MERGED', hex: '#8250df' },
    closed: { label: 'CLOSED', hex: '#cf222e' },
    review_requested: { label: 'AWAITING REVIEW', hex: '#0969da' },
    approved: { label: 'APPROVED', hex: '#1a7f37' },
    changes_requested: { label: 'CHANGES REQUESTED', hex: '#bc4c00' },
    commented: { label: 'COMMENTED', hex: '#6e7781' },
    synchronize: { label: 'UPDATED', hex: '#0969da' },
    reopened: { label: 'REOPENED', hex: '#1a7f37' },
    ready_for_review: { label: 'READY', hex: '#0969da' },
};

const SENTRY_META = {
    critical: { label: 'CRITICAL', hex: '#6c1111' },
    error: { label: 'ERROR', hex: '#922b21' },
    warning: { label: 'WARNING', hex: '#784212' },
    info: { label: 'INFO', hex: '#1e3a5f' },
    unknown: { label: 'UNKNOWN', hex: '#555555' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const trunc = (str, max = 180) => (str && str.length > max ? `${str.slice(0, max)}…` : str || '');

const hexToRgba = hex => {
    const normalizedHex = hex.replace('#', '');
    const redHex = normalizedHex.slice(0, 2);
    const greenHex = normalizedHex.slice(2, 4);
    const blueHex = normalizedHex.slice(4, 6);

    return {
        red: +(parseInt(redHex, 16) / 255).toFixed(3),
        green: +(parseInt(greenHex, 16) / 255).toFixed(3),
        blue: +(parseInt(blueHex, 16) / 255).toFixed(3),
        alpha: 1,
    };
};

const makeCard = (cardId, sections) => ({
    cardsV2: [{ cardId, card: { sections } }],
});

const invalidCard = reason => ({
    cardsV2: [
        {
            card: {
                header: { title: 'Invalid Payload' },
                sections: [{ widgets: [{ decoratedText: { text: reason } }] }],
            },
        },
    ],
});

// ── Fake header: repo name kiri + badge kanan ─────────────────────────────────
const Header = (repoFullName, avatarUrl, badgeMeta, badgeUrl = 'https://github.com') => ({
    columns: {
        columnItems: [
            {
                horizontalSizeStyle: 'FILL_AVAILABLE_SPACE',
                verticalAlignment: 'CENTER',
                widgets: [
                    {
                        decoratedText: {
                            startIcon: {
                                iconUrl: avatarUrl,
                                imageType: 'CIRCLE',
                                altText: repoFullName,
                            },
                            text: `<b>${repoFullName}</b>`,
                            wrapText: false,
                        },
                    },
                ],
            },
            {
                horizontalSizeStyle: 'FILL_MINIMUM_SPACE',
                horizontalAlignment: 'END',
                verticalAlignment: 'CENTER',
                widgets: [
                    {
                        buttonList: {
                            buttons: [
                                {
                                    text: badgeMeta.label,
                                    color: hexToRgba(badgeMeta.hex),
                                    onClick: { openLink: { url: badgeUrl } },
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
});

// ── Action buttons ────────────────────────────────────────────────────────────
const btn = items => ({
    buttonList: {
        buttons: items.map(({ text, url, type }) => ({
            text,
            onClick: { openLink: { url } },
            // default button filled = blue
            ...(type === 'Filled' ? { color: { red: 0.039, green: 0.518, blue: 0.514, alpha: 1 } } : {}),
        })),
    },
});

// ── Shared body widgets ───────────────────────────────────────────────────────
const prTitleWidget = title => ({
    decoratedText: { text: `<b>${title}</b>`, wrapText: true },
});

const branchWidget = (head, base) => ({
    decoratedText: {
        text: `<font color="#57606a">${head}  →  ${base}</font>`,
        wrapText: false,
    },
});

const ciWidget = ({ ci, commentCount }) => {
    let ciColor = '#57606a';
    let ciIcon = '●';
    if (ci.status === 'success') {
        ciColor = '#1a7f37';
        ciIcon = '✔';
    } else if (ci.status === 'failure') {
        ciColor = '#cf222e';
        ciIcon = '✖';
    }
    const parts = [
        `<font color="${ciColor}"><b>${ciIcon} ${ci.label}</b></font>`,
        ...(commentCount > 0
            ? [`<font color="#57606a">💬 ${commentCount} comment${commentCount !== 1 ? 's' : ''}</font>`]
            : []),
    ];
    return { decoratedText: { text: parts.join('  •  ') } };
};

// ─────────────────────────────────────────────────────────────────────────────
//  GITHUB CARD BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

const buildPROpenedCard = ({ pull_request: pr, repository, sender }) => {
    const meta = GITHUB_META.opened;
    const reviewers = (pr.requested_reviewers ?? []).map(r => r.login).join(', ');
    const labels = (pr.labels ?? []).map(l => l.name).join(', ');

    return makeCard(`pr-opened-${pr.number}`, [
        { widgets: [Header(repository.full_name, sender.avatar_url, meta, pr.html_url)] },
        {
            widgets: [
                prTitleWidget(pr.title),
                branchWidget(pr.head.ref, pr.base.ref),
                {
                    decoratedText: {
                        text: [
                            `<font color="#1a7f37"><b>+${pr.additions ?? 0}</b></font>`,
                            `<font color="#cf222e"><b>-${pr.deletions ?? 0}</b></font>`,
                            `<font color="#57606a">•  ${pr.changed_files ?? 0} file${pr.changed_files !== 1 ? 's' : ''}</font>`,
                        ].join('  '),
                    },
                },
                ...(reviewers ? [{ decoratedText: { topLabel: 'REVIEWERS', text: reviewers } }] : []),
                ...(labels ? [{ decoratedText: { topLabel: 'LABELS', text: labels } }] : []),
                ...(pr.body?.trim()
                    ? [{ textParagraph: { text: `<i><font color="#57606a">${trunc(pr.body)}</font></i>` } }]
                    : []),
            ],
        },
        {
            widgets: [
                btn([
                    { text: 'View PR', url: pr.html_url, type: 'Filled' },
                    { text: 'Review Changes', url: `${pr.html_url}/files` },
                ]),
            ],
        },
    ]);
};

const buildPRMergedCard = ({ pull_request: pr, repository, sender }) => {
    const meta = GITHUB_META.merged;
    return makeCard(`pr-merged-${pr.number}`, [
        { widgets: [Header(repository.full_name, sender.avatar_url, meta, pr.html_url)] },
        {
            widgets: [
                prTitleWidget(pr.title),
                branchWidget(pr.head.ref, pr.base.ref),
                {
                    decoratedText: {
                        text: [
                            `<font color="#1a7f37"><b>+${pr.additions ?? 0}</b></font>`,
                            `<font color="#cf222e"><b>-${pr.deletions ?? 0}</b></font>`,
                            `<font color="#57606a">•  ${pr.commits ?? 'N/A'} commits</font>`,
                        ].join('  '),
                    },
                },
                ...(pr.body?.trim()
                    ? [{ textParagraph: { text: `<i><font color="#57606a">${trunc(pr.body)}</font></i>` } }]
                    : []),
            ],
        },
        { widgets: [btn([{ text: 'View PR', url: pr.html_url }])] },
    ]);
};

const buildPRClosedCard = ({ pull_request: pr, repository, sender }) => {
    const meta = GITHUB_META.closed;
    return makeCard(`pr-closed-${pr.number}`, [
        { widgets: [Header(repository.full_name, sender.avatar_url, meta, pr.html_url)] },
        {
            widgets: [
                prTitleWidget(pr.title),
                {
                    decoratedText: {
                        text: `<font color="#57606a">${pr.head.ref}  (not merged into ${pr.base.ref})</font>`,
                    },
                },
                ...(pr.body?.trim()
                    ? [{ textParagraph: { text: `<i><font color="#57606a">${trunc(pr.body)}</font></i>` } }]
                    : []),
            ],
        },
        { widgets: [btn([{ text: 'View PR', url: pr.html_url }])] },
    ]);
};

const buildReviewRequestedCard = ({ pull_request: pr, repository, sender, requested_reviewer }) => {
    const meta = GITHUB_META.review_requested;
    return makeCard(`pr-review-req-${pr.number}`, [
        { widgets: [Header(repository.full_name, sender.avatar_url, meta, pr.html_url)] },
        {
            widgets: [
                prTitleWidget(pr.title),
                branchWidget(pr.head.ref, pr.base.ref),
                { decoratedText: { topLabel: 'REVIEWER', text: requested_reviewer?.login ?? 'N/A' } },
                {
                    textParagraph: {
                        text: '<i><font color="#57606a">You have been requested to review this pull request.</font></i>',
                    },
                },
            ],
        },
        {
            widgets: [
                btn([
                    { text: 'Review Now', url: `${pr.html_url}/files` },
                    { text: 'View PR', url: pr.html_url },
                ]),
            ],
        },
    ]);
};

const buildReviewSubmittedCard = ({ pull_request: pr, repository, sender, review }) => {
    const state = review?.state?.toLowerCase() ?? 'commented';
    const meta = GITHUB_META[state] ?? GITHUB_META.commented;
    return makeCard(`pr-review-${pr.number}`, [
        { widgets: [Header(repository.full_name, sender.avatar_url, meta, pr.html_url)] },
        {
            widgets: [
                prTitleWidget(pr.title),
                ...(review?.body?.trim()
                    ? [{ textParagraph: { text: `<i><font color="#57606a">${trunc(review.body)}</font></i>` } }]
                    : []),
            ],
        },
        {
            widgets: [
                btn([
                    { text: 'View Review', url: review?.html_url ?? pr.html_url },
                    { text: 'View PR', url: pr.html_url },
                ]),
            ],
        },
    ]);
};

const buildSynchronizeCard = ({ pull_request: pr, repository, sender, after }) => {
    const meta = GITHUB_META.synchronize;
    return makeCard(`pr-sync-${pr.number}`, [
        { widgets: [Header(repository.full_name, sender.avatar_url, meta, pr.html_url)] },
        {
            widgets: [
                prTitleWidget(pr.title),
                branchWidget(pr.head.ref, pr.base.ref),
                { decoratedText: { topLabel: 'HEAD SHA', text: (after ?? pr.head.sha ?? '').slice(0, 7) } },
            ],
        },
        {
            widgets: [
                btn([
                    { text: 'View Changes', url: `${pr.html_url}/files` },
                    { text: 'View PR', url: pr.html_url },
                ]),
            ],
        },
    ]);
};

const buildPRStateCard = (payload, actionKey) => {
    const { pull_request: pr, repository, sender } = payload;
    const meta = GITHUB_META[actionKey] ?? GITHUB_META.reopened;
    return makeCard(`pr-${actionKey}-${pr.number}`, [
        { widgets: [Header(repository.full_name, sender.avatar_url, meta, pr.html_url)] },
        {
            widgets: [prTitleWidget(pr.title), branchWidget(pr.head.ref, pr.base.ref)],
        },
        { widgets: [btn([{ text: 'View PR', url: pr.html_url }])] },
    ]);
};

// ── GitHub dispatcher ─────────────────────────────────────────────────────────
const formatGitHubCard = payload => {
    if (!payload.repository) return invalidCard('Missing repository field.');

    if (payload.zen)
        return makeCard('ping', [
            {
                widgets: [
                    Header(payload.repository?.full_name ?? 'GitHub', GITHUB_FAVICON, {
                        label: 'PING',
                        hex: '#57606a',
                    }),
                ],
            },
            { widgets: [{ textParagraph: { text: payload.zen } }] },
        ]);

    const { action, pull_request: pr, review } = payload;

    if (action === 'submitted' && review) return buildReviewSubmittedCard(payload);
    if (action === 'opened') return buildPROpenedCard(payload);
    if (action === 'closed' && pr?.merged) return buildPRMergedCard(payload);
    if (action === 'closed') return buildPRClosedCard(payload);
    if (action === 'review_requested') return buildReviewRequestedCard(payload);
    if (action === 'synchronize') return buildSynchronizeCard(payload);
    if (action === 'reopened') return buildPRStateCard(payload, 'reopened');
    if (action === 'ready_for_review') return buildPRStateCard(payload, 'ready_for_review');

    return makeCard('unhandled', [
        {
            widgets: [
                Header(payload.repository.full_name, GITHUB_FAVICON, { label: action.toUpperCase(), hex: '#57606a' }),
            ],
        },
        { widgets: [{ textParagraph: { text: `Event <b>${action}</b> received.` } }] },
    ]);
};

// ─────────────────────────────────────────────────────────────────────────────
//  SENTRY CARDS
// ─────────────────────────────────────────────────────────────────────────────
const formatSentryCard = payload => {
    const event = payload.event ?? payload.data?.event ?? {};
    const project = payload.project ?? event.project ?? 'N/A';
    const level = (event.level ?? payload.level ?? 'unknown').toLowerCase();
    const meta = SENTRY_META[level] ?? SENTRY_META.unknown;
    const env = event.environment ?? payload.environment ?? 'N/A';
    const release = event.release ?? payload.release ?? 'N/A';
    const culprit = event.culprit ?? payload.culprit ?? '';
    const eventId = event.event_id ?? payload.event_id ?? 'N/A';
    const occurrences = payload.times_seen ? `${payload.times_seen}x` : null;
    const issueUrl = payload.url ?? event.web_url ?? '#';

    return makeCard(`sentry-${eventId}`, [
        { widgets: [Header(project, SENTRY_FAVICON, meta, issueUrl)] },
        {
            widgets: [
                { decoratedText: { text: `<b>${event.title ?? 'Unknown error'}</b>`, wrapText: true } },
                ...(culprit
                    ? [
                          {
                              decoratedText: {
                                  text: `<font color="#57606a">${trunc(culprit, 120)}</font>`,
                                  wrapText: true,
                              },
                          },
                      ]
                    : []),
                {
                    decoratedText: {
                        text: [
                            `<font color="#57606a">Env: <b>${env}</b></font>`,
                            release !== 'N/A' ? `<font color="#57606a">Release: <b>${release}</b></font>` : null,
                            occurrences ? `<font color="#57606a">Seen: <b>${occurrences}</b></font>` : null,
                        ]
                            .filter(Boolean)
                            .join('  •  '),
                    },
                },
                ...(event.message?.trim()
                    ? [{ textParagraph: { text: `<i><font color="#57606a">${trunc(event.message)}</font></i>` } }]
                    : []),
            ],
        },
        { widgets: [btn([{ text: 'View in Sentry', url: issueUrl }])] },
    ]);
};

// ─────────────────────────────────────────────────────────────────────────────
//  INJECTION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Inject CI + comment count widget ke body section (sections[1]) */
const injectCIWidget = (cardMessage, { ci, commentCount }) => {
    try {
        const bodyWidgets = cardMessage.cardsV2[0].card.sections[1].widgets;
        bodyWidgets.splice(2, 0, ciWidget({ ci, commentCount }));
    } catch (err) {
        console.error('injectCIWidget error:', err.message);
    }
    return cardMessage;
};

/**
 * Inject diff lines sebagai teks berwarna — TANPA cloud storage!
 * Insert section baru sebelum section buttons (section terakhir).
 */
const injectDiffText = (cardMessage, diffLines = []) => {
    if (!diffLines.length) return cardMessage;
    try {
        const { sections } = cardMessage.cardsV2[0].card;

        const widgets = diffLines.map(line => {
            const cfg = {
                addition: { color: '#1a7f37', prefix: '+' },
                deletion: { color: '#cf222e', prefix: '-' },
                context: { color: '#57606a', prefix: ' ' },
            }[line.type] ?? { color: '#57606a', prefix: ' ' };

            const escaped = String(line.text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            return {
                decoratedText: {
                    text: `<font face="Courier New" color="${cfg.color}">${cfg.prefix} ${escaped}</font>`,
                    wrapText: true,
                },
            };
        });

        sections.splice(sections.length - 1, 0, {
            header: '<font color="#57606a">CODE CHANGES</font>',
            widgets,
        });
    } catch (err) {
        console.error('injectDiffText error:', err.message);
    }
    return cardMessage;
};

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
const formatGoogleChatMessage = (payload, source) => {
    if (!payload) return invalidCard('Empty payload received.');
    if (source === 'github') return formatGitHubCard(payload);
    if (source === 'sentry') return formatSentryCard(payload);
    return invalidCard(`Unknown source: "${source}".`);
};

// Legacy
const formatSentryMessage = p => formatSentryCard(p);
const formatGitHubMessage = p => formatGitHubCard(p);
const formatGitHubPRMessage = p => formatGitHubCard(p);

module.exports = {
    formatGoogleChatMessage,
    formatSentryMessage,
    formatGitHubMessage,
    formatGitHubPRMessage,
    injectCIWidget,
    injectDiffText,
};
