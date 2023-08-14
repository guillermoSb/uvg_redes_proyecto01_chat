import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorChatsKey =
    GlobalKey<NavigatorState>(debugLabel: 'shellChats');
final _shellNavigatorProfileKey =
    GlobalKey<NavigatorState>(debugLabel: 'shellProfile');
final _shellNavigatorUsersKey =
    GlobalKey<NavigatorState>(debugLabel: 'shellUsers');

final appRouter = GoRouter(
  initialLocation: '/',
  navigatorKey: _rootNavigatorKey,
  routes: [
    GoRoute(path: '/', redirect: (_, __) => '/register'),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return ScaffoldWithNestedNavigation(
          navigationShell: navigationShell,
        );
      },
      branches: [
        StatefulShellBranch(
          navigatorKey: _shellNavigatorChatsKey,
          routes: [
            GoRoute(
                path: '/chats',
                pageBuilder: (context, state) => const NoTransitionPage(
                      child: ChatListScreen(),
                    ),
                routes: [
                  GoRoute(
                    path: 'general',
                    builder: (context, state) {
                      return const ChatScreen(
                        chatTitle: 'General Chat',
                      );
                    },
                  )
                ])
          ],
        ),
        StatefulShellBranch(
          navigatorKey: _shellNavigatorUsersKey,
          routes: [
            GoRoute(
              path: '/users',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: ConnectedUsersScreen(),
              ),
            )
          ],
        ),
        StatefulShellBranch(
          navigatorKey: _shellNavigatorProfileKey,
          routes: [
            GoRoute(
              path: '/profile',
              pageBuilder: (context, state) => const NoTransitionPage(
                child: ProfileScreen(),
              ),
            )
          ],
        ),
      ],
    )
  ],
);

class ScaffoldWithNestedNavigation extends StatelessWidget {
  const ScaffoldWithNestedNavigation({
    Key? key,
    required this.navigationShell,
  }) : super(key: key ?? const ValueKey('ScaffoldWithNestedNavigation'));
  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) {
          navigationShell.goBranch(index);
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(
              Icons.message_rounded,
            ),
            label: 'Chats',
          ),
          BottomNavigationBarItem(
            icon: Icon(
              Icons.people,
            ),
            label: 'Contacts',
          ),
          BottomNavigationBarItem(
            icon: Icon(
              Icons.person,
            ),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
